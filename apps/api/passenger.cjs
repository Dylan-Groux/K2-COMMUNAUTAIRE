// Fichier de démarrage pour Passenger (cPanel → Setup Node.js App) : lance l'API TypeScript avec tsx.
// Le dossier courant devient apps/api, comme en dev : .env et ./data/k2.db s'y trouvent.
process.chdir(__dirname)

import("tsx/esm/api")
  .then(({ register }) => {
    register()
    return import("./src/server.ts")
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
