# K2 Communautaire

Site de la communauté Discord QSL : accueil immersif, lore en manga, et annuaire des membres (onglet Steam, un sous-onglet par jeu avec les liens et codes amis).
Le design vient du projet Figma Make « Site web pour Discord K2 ».

## Démarrage

Il faut Node 24 ou plus (l'API utilise le module SQLite intégré `node:sqlite`).

```bash
npm install
npm run seed   # ajoute les membres (src/db/seed.ts) absents de la base
npm run dev    # API sur :3001, site sur http://localhost:5173
```

| Commande            | Rôle                                                    |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | lance l'API et le front en parallèle                    |
| `npm test`          | lance tous les tests (shared, api, web)                 |
| `npm run typecheck` | vérifie les types de tous les packages                  |
| `npm run build`     | build de production du front dans `apps/web/dist`       |

## Architecture

Monorepo npm workspaces. Le front et l'API sont séparés et ne partagent que `@k2/shared`.

```
packages/shared      types, catalogue des jeux, logique des rangs
apps/api             API REST Express + SQLite, publique et en lecture seule
  src/app.ts           assemble l'app à partir de ses dépendances (createApp)
  src/db/              connexion, schéma, seed
  src/lib/             HttpError
  src/middlewares/     gestion des erreurs
  src/modules/<x>/     repository (SQL) -> service (métier) -> routes (HTTP)
  test/                tests d'intégration supertest sur base en mémoire
apps/web             front React (Vite, Tailwind, TanStack Query, React Router)
  src/app/             providers et routes
  src/components/      composants partagés (Shell, Header, Rank…)
  src/features/<x>/    une feature = ses pages, ses requêtes (queries.ts) et sa logique pure
  src/lib/             client API, helpers (format, constantes)
  src/test/            rendu avec routeur et mock de fetch
```

L'annuaire vit dans l'onglet `/steam` : Steam par défaut, puis `/steam/<jeu>` pour chaque jeu. Les anciennes adresses `/jeux/...` y redirigent.

Le site n'a pas d'inscription ni de connexion : il affiche ce que contient la base. Les membres et leurs comptes de jeu sont listés dans `apps/api/src/db/seed.ts` (liens et codes amis, sans rang en V1), en attendant un import depuis le bot Discord.

### API

Toutes les routes sont publiques et en lecture seule.

| Méthode | Route                         | Rôle                                  |
| ------- | ----------------------------- | ------------------------------------- |
| GET     | `/api/games`                  | jeux et nombre de membres par jeu     |
| GET     | `/api/games/:slug/accounts`   | comptes des membres pour un jeu       |
| GET     | `/api/members/:pseudo`        | fiche publique d'un membre            |

En développement, Vite redirige `/api` vers `localhost:3001`, donc le front et l'API ont la même origine.

### Lore (manga)

L'onglet `/lore` présente le manga du serveur, *Le Livre des Cycles*, et `/lore/chapitre-1` ouvre le lecteur. Les pages s'affichent l'une sous l'autre et sont dessinées depuis le PDF au fil du scroll, avec pdf.js. Un lien permet aussi d'ouvrir le PDF d'origine.

Pour publier un chapitre :
1. dépose le PDF dans `apps/web/public/lore/` ;
2. ajoute son `pdf` et son nombre de `pages` à l'entrée correspondante de `src/features/lore/chapters.ts`. Un chapitre sans `pdf` s'affiche « Prochainement ».

En production, le serveur doit renvoyer `index.html` pour les routes du site (`/lore/chapitre-1`…), comme pour les autres pages.

### APIs externes

Ce qu'on peut récupérer des APIs de jeux (rangs, elo) et de Discord (activité, rôles) : voir [docs/API-JEUX.md](docs/API-JEUX.md).

### Configuration

Copier `apps/api/.env.example` vers `apps/api/.env` et `apps/web/.env.example` vers `apps/web/.env`.
Les valeurs de production du front sont dans `apps/web/.env.production` (publiques, versionnées).

L'accueil (`src/features/home`) est une scène Three.js pilotée par le scroll. Sans données il affiche un exemple (badge « Exemple »).
`VITE_WIDGET_URL` branche le widget du header, les salons vocaux et les avatars ; `VITE_STATS_URL` branche le classement « jeu du moment ». En production, les deux pointent vers les fichiers du bot QSL (`/bot/widget.json`, `/bot/stats.json`), donc le widget officiel de Discord n'est pas nécessaire. Le bouton Steam de l'accueil mène à l'annuaire `/steam`, comme l'en-tête des autres pages.

`VITE_LIVE_URL` (`/bot/live.json` en production) choisit les stations de jeu de l'accueil : jusqu'à 4 jeux joués en ce moment, triés par nombre de joueurs. Le bot ne compte un jeu qu'après 3 min de présence et le garde 15 min après le départ du dernier joueur. La liste est figée au chargement ; si un jeu apparaît ensuite, un bandeau propose de l'afficher. Personne en jeu : une station de veille rappelle les horaires du serveur. Fichier absent ou vieux de plus de 5 min : les quatre jeux historiques. Un jeu sans modèle 3D reçoit une station générique à sa couleur ; pour lui créer sa station, ajoute-le à `TRACKED_GAMES` et `GAME_PANELS` (`content.ts`) et à `STATION_MODELS` (`scene/registry.ts`).

## Mise en production (o2switch)

```
~/k2-communautaire      ce dépôt (hors de public_html)
~/public_html           le front construit (copié par le script)
~/public_html/bot       écrit par le bot QSL (EXPORT_DIR) : widget.json, stats.json, live.json
api.<domaine>           l'API, application Node gérée par Passenger
```

**Première installation**
1. En SSH : `git clone https://github.com/Dylan-Groux/K2-COMMUNAUTAIRE.git ~/k2-communautaire`.
2. Dans cPanel, créer le sous-domaine `api.<domaine>`, puis dans **Setup Node.js App** : Node 24, racine de l'application `k2-communautaire`, URL `api.<domaine>`, fichier de démarrage `apps/api/passenger.cjs`. Ne clique **pas** sur « Run NPM Install » : le monorepo s'installe avec le script ci-dessous.
3. Créer `apps/api/.env` sur le serveur, avec `WEB_ORIGIN=https://<domaine>` pour autoriser le site.
4. Dans `apps/web/.env.production`, renseigner `VITE_API_URL=https://api.<domaine>/api`, puis commiter.
5. Côté bot : `EXPORT_DIR=/home/IDENTIFIANT/public_html/bot` (voir le README du bot).

**Avec le bot sur le même hébergement** (dossier `~/k2-bot`, dépôt séparé)
- Ce sont deux applications distinctes dans **Setup Node.js App**, chacune avec son environnement (`nodevenv/k2-bot/…` et `nodevenv/k2-communautaire/…`). Le script de déploiement utilise celui du site.
- L'application « bot » de cPanel (le fichier factice `passenger-placeholder.cjs`) doit avoir sa **propre URL**, par exemple `bot-app.<domaine>`, jamais la racine du domaine du site : Passenger intercepterait alors toutes les pages.
- Le bot écrit dans `~/public_html/bot` avec le même utilisateur Linux : aucun droit à régler. Comme ces fichiers sont servis par le même domaine que le site, il n'y a pas de CORS non plus.
- Le script de déploiement ne supprime jamais `public_html/bot`, et le `.htaccess` du site ne réécrit pas ce dossier.

### Déploiement automatique (CI/CD)

Un push sur `master` suffit. GitHub Actions lance le typecheck, les tests et le build ([.github/workflows/ci.yml](.github/workflows/ci.yml)), puis publie la branche `deploy` : le commit testé, plus le front construit (`apps/web/dist`). Sur o2switch, une tâche cron lance [scripts/deploy.sh](scripts/deploy.sh) toutes les 2 minutes : c'est **le serveur qui vient chercher** la branche `deploy`, GitHub ne se connecte jamais au serveur.

```
~/k2-communautaire-prod/
  repo.git/        clone nu, sert uniquement à récupérer le code
  releases/<sha>/  une version complète (code, front construit, node_modules de l'API), les 3 dernières sont gardées
  current          lien vers la version en ligne
  shared/          .env et data/k2.db de l'API, logs/, deploy.conf : ne bougent pas d'une version à l'autre
```

À chaque nouvelle version, le script l'installe à côté, complète la base avec le seed, bascule `current`, copie le front dans le dossier du site (sans toucher à `bot/` ni à `.well-known/`), redémarre l'API et vérifie qu'elle répond sur `<VITE_API_URL>/health`. Sinon il remet la version précédente. Une version qui a échoué n'est pas retentée (`shared/failed-sha`) : pousse un correctif, ou supprime ce fichier pour réessayer.

**Mise en place (une seule fois, en SSH)**

Le dossier `~/k2-communautaire` reste en place : l'application Node de cPanel et son environnement en dépendent.

1. **Préparer le dossier** (le dépôt est public, aucun identifiant n'est nécessaire) :
   ```bash
   mkdir -p ~/k2-communautaire-prod/shared/data ~/k2-communautaire-prod/shared/logs && cd ~/k2-communautaire-prod
   git init --bare repo.git
   git --git-dir=repo.git remote add origin https://github.com/Dylan-Groux/K2-COMMUNAUTAIRE.git
   git --git-dir=repo.git fetch origin '+refs/heads/deploy:refs/heads/deploy'
   ```
2. **Reprendre la configuration et la base** : `cp ~/k2-communautaire/apps/api/.env shared/.env && cp ~/k2-communautaire/apps/api/data/* shared/data/`
3. **Indiquer le dossier du site**, celui qu'Apache sert pour le domaine (cPanel → Domaines, colonne « Racine du document ») :
   ```bash
   echo 'WEB_ROOT=/home/IDENTIFIANT/DOSSIER_DU_SITE' > shared/deploy.conf
   ```
   Le script y applique `rsync --delete` : vérifie bien le chemin. Ne mets `public_html` que si aucun autre site du compte n'y vit dans un sous-dossier, sinon il serait effacé.
4. **Premier déploiement** : `current` n'existe pas encore, on sort donc le script du dépôt dans un fichier.
   ```bash
   git --git-dir=repo.git show deploy:scripts/deploy.sh > deploy-first.sh
   bash deploy-first.sh
   cat shared/logs/deploy.log
   rm deploy-first.sh
   ```
   À ce stade le front est à jour, mais l'API tourne encore depuis `~/k2-communautaire`.
5. **Brancher l'API sur la version en ligne** : Passenger garde `apps/api/passenger.cjs` comme fichier de démarrage, on le remplace par un relais vers `current`.
   ```bash
   cp current/scripts/passenger-current.cjs ~/k2-communautaire/apps/api/passenger.cjs
   touch ~/k2-communautaire/tmp/restart.txt
   ```
   Vérifie ensuite `https://api.<domaine>/api/health`.
6. **Créer la tâche cron** :
   ```
   */2 * * * * bash /home/IDENTIFIANT/k2-communautaire-prod/current/scripts/deploy.sh >/dev/null 2>&1
   ```

**Au quotidien**

- Suivre un déploiement : `tail -f ~/k2-communautaire-prod/shared/logs/deploy.log`
- Revenir à la version précédente : `bash ~/k2-communautaire-prod/current/scripts/deploy.sh rollback`
- Ne fais plus de `git pull` dans `~/k2-communautaire` : il écraserait le relais de l'étape 5.

Le `.htaccess` du front renvoie `index.html` pour les routes du site et laisse passer `/bot/`. Tant que le bot n'écrit rien, l'accueil reste en mode « Exemple ».

Idée futur : lore du serveur automatique, IA capable de faire suivre une histoire fantaisique comme un manga, a partir de prompt décivrant nos games de la journée de la semaine 