#!/bin/bash
# Déploiement « pull » sur o2switch. Appelé par une tâche cron toutes les 2 minutes (voir README, mise en production).
#
#   deploy.sh            déploie origin/deploy s'il a changé, sinon ne fait rien
#   deploy.sh rollback   revient à la version précédente
#
# Arborescence ($BASE) :
#   repo.git/        clone nu, sert uniquement à récupérer le code
#   releases/<sha>/  une version complète (code + front construit + node_modules de l'API)
#   current          lien vers la version en ligne
#   shared/          ce qui survit aux déploiements : .env et data/ (base SQLite) de l'API, logs/, deploy.conf
#
# Le script ne dépend pas de son emplacement ($0) : on peut le lancer depuis n'importe quelle version.
set -uo pipefail

BASE="${K2_BASE:-$HOME/k2-communautaire-prod}"
KEEP=3

BASE="$(cd "$BASE" && pwd -P)" || exit 1
SHARED="$BASE/shared"
GIT=(git --git-dir="$BASE/repo.git")
mkdir -p "$BASE/releases" "$SHARED/data" "$SHARED/logs"

# Un seul déploiement à la fois : si le précédent tourne encore, ce cron s'arrête aussitôt.
exec 9>"$SHARED/deploy.lock"
flock -n 9 || exit 0

log() { echo "$(date '+%F %T') $*" >> "$SHARED/logs/deploy.log"; }

# deploy.conf : WEB_ROOT (obligatoire), et au besoin NODEVENV ou APP_ROOT.
# shellcheck disable=SC1091
[ -f "$SHARED/deploy.conf" ] && source "$SHARED/deploy.conf"
NODEVENV="${NODEVENV:-$HOME/nodevenv/k2-communautaire/24/bin/activate}"
# Dossier déclaré dans cPanel → Setup Node.js App : Passenger y surveille tmp/restart.txt.
APP_ROOT="${APP_ROOT:-$HOME/k2-communautaire}"
# Dossier servi par Apache pour le site. Pas de valeur par défaut : rsync --delete s'y applique.
WEB_ROOT="${WEB_ROOT:-}"
[ -n "$WEB_ROOT" ] && [ -d "$WEB_ROOT" ] || { log "WEB_ROOT absent ou introuvable : voir $SHARED/deploy.conf"; exit 1; }

current_sha() { basename "$(readlink "$BASE/current" 2>/dev/null)" 2>/dev/null; }

# Bascule atomique : le lien est créé à côté puis renommé, « current » n'est jamais absent ni à moitié écrit.
# (Pas « activate » : le script activate de CloudLinux, sourcé plus bas, écraserait la fonction.)
link_current() {
  ln -s "$BASE/releases/$1" "$BASE/current.tmp" && mv -T "$BASE/current.tmp" "$BASE/current"
}

# Les fichiers de assets/ portent leur empreinte : on les copie d'abord, puis index.html qui les référence,
# et seulement ensuite on supprime les anciens. Un visiteur ne tombe jamais sur une page sans ses fichiers.
# bot/ appartient au bot QLS, .well-known/ au certificat SSL : jamais supprimés.
sync_web() {
  local dist="$BASE/releases/$1/apps/web/dist/"
  rsync -a --exclude index.html "$dist" "$WEB_ROOT"/ &&
    rsync -a --delete --exclude bot/ --exclude .well-known/ --exclude cgi-bin/ "$dist" "$WEB_ROOT"/
}

# L'API répond-elle ? L'adresse est celle que le front utilise (VITE_API_URL), donc rien à configurer.
# Passenger relance l'API à la première requête qui suit restart.txt : c'est ce curl qui la déclenche.
healthy() {
  local url i
  url="$(sed -n 's/^VITE_API_URL=//p' "$BASE/releases/$1/apps/web/.env.production" | tr -d '\r')/health"
  for i in $(seq 6); do
    curl -fsS -m 20 -o /dev/null "$url" 2>> "$SHARED/logs/deploy.log" && return 0
    sleep 5
  done
  return 1
}

switch_to() {
  link_current "$1" || return 1
  sync_web "$1" >> "$SHARED/logs/deploy.log" 2>&1 || return 1
  mkdir -p "$APP_ROOT/tmp" && touch "$APP_ROOT/tmp/restart.txt"
  healthy "$1"
}

# Marque une version comme ratée : sans ça, le cron la redéploierait toutes les 2 minutes.
# Un nouveau push la remplace ; pour la retenter telle quelle : rm shared/failed-sha
mark_failed() { echo "$1" > "$SHARED/failed-sha"; }

prepare() {
  local dir="$BASE/releases/$1"
  rm -rf "$dir"
  mkdir -p "$dir" || return 1
  "${GIT[@]}" archive "$1" | tar -x -C "$dir" || return 1
  [ -f "$dir/apps/web/dist/index.html" ] || { log "pas de front construit dans $1"; return 1; }
  ln -s "$SHARED/.env" "$dir/apps/api/.env" || return 1
  ln -s "$SHARED/data" "$dir/apps/api/data" || return 1
  # Seulement l'API : le front est déjà construit, inutile d'installer React et Three.js sur le serveur.
  (cd "$dir" && npm ci --omit=dev -w @k2/api --no-audit --no-fund) >> "$SHARED/logs/deploy.log" 2>&1 || return 1
  # Garde-fou : sur CloudLinux, npm peut installer ailleurs que dans le dossier courant.
  [ -x "$dir/node_modules/.bin/tsx" ] && [ -e "$dir/node_modules/@k2/shared" ] || return 1
  # Ajoute à la base les membres absents du seed, sans toucher aux existants.
  (cd "$dir" && npm run --silent seed) >> "$SHARED/logs/deploy.log" 2>&1
}

cleanup() {
  local keep dir
  keep="$(current_sha)"
  for dir in $(ls -1dt "$BASE"/releases/*/ | tail -n +$((KEEP + 1))); do
    [ "$(basename "$dir")" = "$keep" ] || rm -rf "$dir"
  done
}

# activate (CloudLinux) lit des variables non définies : pas de « set -u » pendant le source.
set +u
# shellcheck disable=SC1090
source "$NODEVENV" || { log "nodevenv introuvable : $NODEVENV"; exit 1; }
set -u

if [ "${1:-}" = "rollback" ]; then
  from="$(current_sha)"
  to="$(cat "$SHARED/previous-sha" 2>/dev/null)"
  [ -n "$to" ] && [ -d "$BASE/releases/$to" ] || { echo "Pas de version précédente disponible."; exit 1; }
  mark_failed "$from"
  log "rollback manuel $from → $to"
  if switch_to "$to"; then
    echo "$from" > "$SHARED/previous-sha"
    echo "Revenu à $to."
  else
    echo "L'API ne répond pas non plus sur $to : voir $SHARED/logs/deploy.log"
    exit 1
  fi
  exit 0
fi

timeout 60 "${GIT[@]}" fetch --quiet origin '+refs/heads/deploy:refs/heads/deploy' 2>> "$SHARED/logs/deploy.log" ||
  { log "git fetch impossible"; exit 1; }
target="$("${GIT[@]}" rev-parse refs/heads/deploy)" || exit 1
previous="$(current_sha)"

[ "$target" = "$previous" ] && exit 0
[ "$target" = "$(cat "$SHARED/failed-sha" 2>/dev/null)" ] && exit 0

log "déploiement ${previous:-aucune} → $target"

if ! prepare "$target"; then
  log "ÉCHEC préparation de $target (la version en ligne n'a pas été touchée)"
  mark_failed "$target"
  rm -rf "$BASE/releases/$target"
  exit 1
fi

if switch_to "$target"; then
  [ -n "$previous" ] && echo "$previous" > "$SHARED/previous-sha"
  log "OK $target en ligne"
  cleanup
  exit 0
fi

mark_failed "$target"
if [ -n "$previous" ] && switch_to "$previous"; then
  log "ÉCHEC $target ne répond pas, retour à $previous"
else
  log "ÉCHEC $target ne répond pas, et aucune version précédente ne répond : voir logs/deploy.log"
fi
exit 1
