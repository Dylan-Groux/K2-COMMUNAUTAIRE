#!/bin/bash
# Mise en ligne sur o2switch, en SSH, après un `git pull` dans le dossier du dépôt :
#   NODEVENV=/home/IDENTIFIANT/nodevenv/k2-communautaire/24/bin/activate bash scripts/deploy-o2switch.sh
# Installe, teste, construit le front, le copie dans public_html et redémarre l'API.
set -euo pipefail
cd "$(dirname "$0")/.."

NODEVENV="${NODEVENV:-$HOME/nodevenv/k2-communautaire/24/bin/activate}"
WEB_ROOT="${WEB_ROOT:-$HOME/public_html}"

if ! grep -Eq '^VITE_API_URL=.+' apps/web/.env.production; then
  echo "VITE_API_URL est vide dans apps/web/.env.production : renseigne l'URL de l'API." >&2
  exit 1
fi

# shellcheck source=/dev/null
source "$NODEVENV"

npm ci
npm test
npm run build
# Ajoute à la base de l'API les membres absents du seed, sans toucher aux existants.
npm run seed

# bot/ appartient au bot QLS, .well-known/ au certificat SSL : jamais supprimés.
rsync -a --delete \
  --exclude bot/ --exclude .well-known/ --exclude cgi-bin/ \
  apps/web/dist/ "$WEB_ROOT"/

# Passenger redémarre l'API à la prochaine requête.
mkdir -p tmp && touch tmp/restart.txt
echo "Site en ligne dans $WEB_ROOT, API redémarrée."
