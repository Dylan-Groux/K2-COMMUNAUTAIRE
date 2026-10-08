# APIs de jeux et Discord : ce qu'on peut récupérer pour K2

Ce document fait le point, jeu par jeu, sur les données qu'on peut obtenir automatiquement pour nos fonctionnalités : **rang / elo**, **liaison de compte**, **activité des membres** (qui joue à quoi, jeux les plus joués du moment).

État des lieux au 2 octobre 2026. Les conditions d'accès des éditeurs changent souvent : à revérifier avant de développer une intégration.

## En bref

| Jeu / service         | API officielle                  | Rang / elo automatique          | Activité (qui joue)            | Verdict pour K2                       |
| --------------------- | ------------------------------- | ------------------------------- | ------------------------------ | ------------------------------------- |
| League of Legends     | Oui (Riot)                      | Oui : tier, division, LP        | Historique de parties          | **À intégrer en premier**             |
| Valorant              | Oui (Riot), très restreinte     | Non pour un joueur donné        | Limité                         | Rang déclaré                          |
| Apex Legends          | Non (API communautaire)         | Oui : rang, division, score     | Non                            | Intégrable, sans garantie de service  |
| Rocket League         | Non                             | Non                             | Non                             | Rang déclaré                          |
| Aion 2                | Oui (NCSoft Open API), accès flou | Classement, puissance de combat | Non                          | À creuser auprès de NCSoft            |
| Aniimo                | Non trouvée                     | Non                             | Non                             | Rang déclaré                          |
| Discord               | Oui                             | —                               | **Oui, via un bot**            | **Pilier de la feature activité**     |
| Steam                 | Oui                             | Niveau Steam                    | **Oui** : jeu en cours, temps de jeu 2 semaines | **À intégrer**                        |

Notre modèle de données colle déjà à ce besoin : `rankTier`, `rankDivision`, `rankLp`, `rankUpdatedAt` et `rankDeclared` (faux quand le rang vient d'une API, vrai quand le membre l'a saisi).

---

## League of Legends — Riot Games API

**Accès.** Clé API sur le [portail développeur Riot](https://developer.riotgames.com/). Une clé *personnelle* sert au développement mais **ne peut pas être utilisée pour un site public**, même en bêta ouverte. Pour la mise en ligne il faut une clé *production*, accordée sur dossier avec un prototype fonctionnel ([politique des clés](https://developer.riotgames.com/docs/portal)).

**Ce qu'on récupère :**

| Besoin K2                     | Endpoint                                                      | Données                                      |
| ----------------------------- | ------------------------------------------------------------- | -------------------------------------------- |
| Retrouver le compte           | `GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}` | `puuid` à partir du Riot ID `SOREDAR#EUW`    |
| Rang classé                   | `GET /lol/league/v4/entries/by-puuid/{puuid}` *(à confirmer sur le portail ; l'ancienne version passe par l'id d'invocateur)* | `queueType`, `tier`, `rank`, `leaguePoints`, victoires, défaites |
| Historique / activité         | `GET /lol/match/v5/matches/by-puuid/{puuid}/ids` puis `/lol/match/v5/matches/{id}` | parties récentes, champion, résultat, date |
| Top du serveur                | `/lol/league/v4/challengerleagues/by-queue/{queue}` etc.      | ladders Master+                              |

Valeurs de tier : `IRON` → `CHALLENGER`, divisions `I` à `IV` ([source](https://darkintaqt.com/blog/league-v4-summoner)).

**Correspondance avec notre modèle :** `tier` → `rankTier` (à traduire : `GOLD` → « Or »…), `rank` → `rankDivision`, `leaguePoints` → `rankLp`, `rankDeclared = false`.

**Vérifier qu'un compte appartient bien au membre :** avec une clé production, **RSO (Riot Sign On)** permet au membre de se connecter avec son compte Riot. Sans RSO, on peut seulement faire confiance au Riot ID saisi.

**Pour nos features :**
- Rang LoL mis à jour automatiquement (tâche planifiée toutes les quelques heures, dans les limites de débit).
- Classement interne K2 par rang et LP.
- Activité : « X parties jouées cette semaine par les membres », champions les plus joués.

## Valorant — Riot Games API

Même portail, mais **les clés personnelles n'ont pas accès à l'API Valorant** : il faut une clé production ([doc Valorant](https://developer.riotgames.com/docs/valorant)). Même avec, `val-ranked-v1` ne fournit que le **classement des meilleurs joueurs** (leaderboard), pas le rang d'un joueur quelconque. L'historique de parties (`val-match-v1`) est soumis à des règles d'usage strictes et demande RSO.

**Verdict :** garder le **rang déclaré**. Revoir la question si on obtient une clé production avec RSO.

## Apex Legends — API communautaire

Pas d'API officielle EA / Respawn. La référence est l'[Apex Legends API](https://apexlegendsapi.com/) (mozambiquehe.re), **non officielle**, sans garantie de disponibilité.

- Clé gratuite, une par projet. Débit de départ : 5 requêtes / seconde, augmentable.
- `GET /bridge?player={pseudo}&platform={PC|PS4|X1|SWITCH}` ou `?uid=` : stats du joueur, dont le rang classé (nom du rang, division, score). C'est ce qui couvre notre `rankTier` / `rankDivision` / `rankLp`.
- `/nametouid`, `/predator` (seuil Predator), `/maprotation` (rotation des cartes), `/servers`.
- L'historique de parties (`/games`) demande une validation manuelle.

Le [Tracker Network](https://tracker.gg/developers) propose aussi une API Apex, sur candidature.

**Pour nos features :** rang Apex automatique ; bonus facile : un widget **rotation des cartes** sur la page du jeu.
**Précaution :** si l'API ne répond pas, garder le dernier rang connu et afficher sa date (`rankUpdatedAt`).

## Rocket League

**Pas d'API publique.** Psyonix ne publie que les répartitions de rangs par saison, et le Tracker Network **ne propose pas d'API Rocket League** ([source](https://tracker.gg/developers)). Les outils qui affichent le MMR (BakkesMod…) tournent sur la machine du joueur.

**Verdict :** **rang déclaré**, avec le lien tracker en vérification visuelle (c'est ce que fait déjà le site). Le scraping de tracker.gg est à proscrire (conditions d'utilisation).

## Aion 2 — NCSoft

Des sites tiers ([aion2.app](https://aion2.app/leaderboard), [shugo.gg](https://shugo.gg/leaderboard), [aion2t.com](https://aion2t.com/leaderboard)) affichent classements, puissance de combat et fiches de personnages en s'appuyant sur une **NCSoft Open API** (régions Global, Corée, Taïwan). Le portail est [developers.plaync.com](https://developers.plaync.com/), mais **la procédure d'accès n'est pas documentée publiquement** ([question restée sans réponse](https://github.com/go2fofo/aion2-portal/issues/2)).

**Données possibles si l'accès est obtenu :** fiche personnage (classe, niveau, puissance de combat, score d'équipement) et points de classement PvP / donjons.
**Attention :** Aion 2 n'a pas de « rang » à la LoL. Il faudrait afficher la **puissance de combat** ou la **position au classement** à la place du tier.

**Prochaine étape :** créer un compte sur le portail PlayNC et regarder ce qui est proposé ; en attendant, **rang déclaré**.

## Aniimo

Jeu de capture de créatures en monde ouvert (Pawprint Studio), sorti le 15 septembre 2026 ([Steam](https://store.steampowered.com/app/4126040/Aniimo/)). **Aucune API publique trouvée.**

**Verdict :** rang déclaré et code ami (déjà en place). À surveiller : les jeux free-to-play récents ouvrent parfois une API après le lancement.

---

## Discord — liaison, rôles et activité

La [doc OAuth2](https://docs.discord.com/developers/topics/oauth2) et les scopes utiles, tous disponibles sans validation :

| Scope                    | Ce qu'il apporte à K2                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------- |
| `identify`               | **Connexion avec Discord** à la place (ou en plus) de l'email / mot de passe           |
| `guilds.members.read`    | Vérifier que la personne est **membre du serveur K2**, récupérer son pseudo et ses rôles |
| `connections`            | Comptes liés à son profil Discord : **Steam, Epic Games, Xbox, PlayStation**… ([types](https://docs.discord.com/developers/resources/user)) → pré-remplir le profil sans saisie |
| `role_connections.write` | **Linked Roles** (voir plus bas)                                                       |

Le scope `activities.read` (« joue actuellement à… ») **n'est pas ouvert aux applications**.

### Rôles automatiques par rang (Linked Roles)

Avec les [Linked Roles](https://docs.discord.com/developers/tutorials/configuring-app-metadata-for-linked-roles), notre app publie des métadonnées par membre et les admins du serveur créent des rôles conditionnés dessus. Exemple : rôle « LoL Diamond+ » si `lol_rank >= 7`. **Maximum 5 métadonnées** par application ([source](https://docs.discord.com/developers/resources/application-role-connection-metadata)), donc à choisir : par exemple un score de rang par jeu principal (LoL, Apex, Valorant, Rocket League) plus `jeux_renseignes`.

### Activité en direct : un bot sur le serveur

Pour savoir **à quoi jouent les membres en ce moment**, il faut un **bot** connecté à la gateway avec l'intent privilégié `GUILD_PRESENCES`. Il reçoit l'activité de chaque membre (« Joue à Apex Legends »). Pour un bot présent sur **moins de 100 serveurs** (notre cas), l'intent s'active simplement dans le portail développeur, sans validation ([source](https://mintlify.com/discord-jda/JDA/core-concepts/gateway-intents)).

Le bot peut aussi : compter les membres et membres en ligne (pour la stat « 1 200+ membres » de l'accueil), annoncer les sessions, attribuer des rôles.

**Limite :** un membre qui masque son activité dans Discord n'apparaît pas. C'est un choix de vie privée à respecter.

## Steam Web API

Clé gratuite sur [steamcommunity.com/dev/apikey](https://steamcommunity.com/dev/apikey). Fonctionne uniquement pour les **profils publics**.

| Endpoint                            | Données utiles                                              |
| ----------------------------------- | ----------------------------------------------------------- |
| `ISteamUser/GetPlayerSummaries`     | pseudo, avatar, statut en ligne, **jeu en cours** (`gameextrainfo`) |
| `IPlayerService/GetRecentlyPlayedGames` | jeux joués ces **2 dernières semaines** et temps de jeu |
| `IPlayerService/GetOwnedGames`      | bibliothèque et temps de jeu total                          |
| `IPlayerService/GetSteamLevel`      | niveau Steam (notre « Niveau 42 » actuel, automatisé)      |

**Pour nos features :** avatars réels dans l'annuaire Steam, statut « En jeu / Disponible », et surtout le **temps de jeu sur 2 semaines** pour le classement des jeux du moment.

---

## Feature « Activité » : jeux les plus joués du moment

En combinant les sources ci-dessus, on peut construire une page ou une section d'accueil **« Ce que joue K2 »**.

| Indicateur                                  | Source                              | Fiabilité                          |
| ------------------------------------------- | ----------------------------------- | ---------------------------------- |
| Membres en jeu **maintenant**, par jeu      | Bot Discord (présence)              | Bonne, tous jeux confondus         |
| **Top des jeux de la semaine** (heures)     | Bot Discord (durée des sessions) + Steam (2 semaines) | Bonne                |
| Parties LoL jouées par les membres          | Riot match-v5                       | Très bonne, mais LoL seulement     |
| Jeux renseignés sur les profils             | Notre base                          | Déjà disponible                    |
| Membres actifs sur le site                  | Notre base (dernière connexion)     | Facile à ajouter                   |

**Principe technique (simple) :**
1. Le bot écoute les changements de présence et enregistre des **sessions** : `(membre, jeu, début, fin)`.
2. Une table d'agrégats par jour : `(jour, jeu, joueurs_distincts, minutes)`.
3. L'API expose `GET /api/activity/top?period=7d` et `GET /api/activity/live`.
4. Le front affiche le top 5 de la semaine, une tendance par rapport à la semaine précédente et un compteur « en jeu maintenant ».

Le bot est un **troisième service** à côté de l'API et du site (il doit rester connecté en permanence). Il écrit dans la même base ou appelle l'API.

**Vie privée :** afficher des chiffres agrégés (« 12 membres sur Apex cette semaine ») plutôt que l'historique individuel, et laisser chacun désactiver le suivi depuis son profil.

---

## Ordre de mise en œuvre conseillé

1. **Connexion Discord** (`identify`, `guilds.members.read`, `connections`) : un seul bouton pour s'inscrire, vérification d'appartenance au serveur, Steam / Epic pré-remplis.
2. **Steam Web API** : avatars, statut, temps de jeu. Clé gratuite, sans validation.
3. **Bot Discord + feature Activité** : jeux en cours et top de la semaine.
4. **Riot API (LoL)** : rang automatique. Démarrer en clé personnelle pour le développement et **demander la clé production tôt**, le délai peut être long.
5. **Apex** via l'API communautaire, avec repli sur le dernier rang connu.
6. **Linked Roles** Discord, une fois les rangs automatiques en place.
7. **Aion 2** si NCSoft ouvre l'accès ; Valorant si RSO est obtenu.

Rocket League et Aniimo restent en **rang déclaré**.

Côté code, chaque source peut devenir un module `apps/api/src/modules/integrations/<jeu>` exposant la même fonction `fetchRank(account)`. Le reste de l'application n'a alors pas besoin de savoir si un rang est automatique ou déclaré.
