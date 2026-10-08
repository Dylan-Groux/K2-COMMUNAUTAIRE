# K2 Communautaire

Site de la communauté Discord QLS : accueil immersif, lore en manga, et annuaire des membres (onglet Steam, un sous-onglet par jeu avec les rangs).
Le design vient du projet Figma Make « Site web pour Discord K2 ».

## Démarrage

Il faut Node 24 ou plus (l'API utilise le module SQLite intégré `node:sqlite`).

```bash
npm install
npm run seed   # crée le membre de démo RedarDG et ses comptes de jeu
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

Le site n'a pas d'inscription ni de connexion : il affiche ce que contient la base. Les membres et leurs comptes de jeu y sont ajoutés par le seed, en attendant un import depuis le bot Discord.

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
En production, renseigner `VITE_DISCORD_URL` avec le vrai lien d'invitation.

L'accueil (`src/features/home`) est une scène Three.js pilotée par le scroll. Sans configuration il affiche des données d'exemple (badge « Exemple ») :
`VITE_DISCORD_GUILD_ID` branche le widget Discord du serveur (à activer dans Paramètres du serveur → Widget), `VITE_STATS_URL` branche le classement « jeu du moment » du bot. Le bouton Steam de l'accueil mène à l'annuaire `/steam`, comme l'en-tête des autres pages.

Idée futur : lore du serveur automatique, IA capable de faire suivre une histoire fantaisique comme un manga, a partir de prompt décivrant nos games de la journée de la semaine 