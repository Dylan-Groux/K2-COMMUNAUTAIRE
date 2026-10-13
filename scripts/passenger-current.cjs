// À copier une seule fois sur le serveur, à la place de ~/k2-communautaire/apps/api/passenger.cjs (voir README).
// Passenger garde son dossier d'application fixe ; ce relais lui fait lancer l'API de la version en ligne.
// Node suit le lien « current » : l'API démarre dans releases/<sha>/apps/api, avec ses propres node_modules.
const path = require("node:path")
const base = process.env.K2_BASE || path.join(require("node:os").homedir(), "k2-communautaire-prod")

require(path.join(base, "current/apps/api/passenger.cjs"))
