import type * as THREE from "three"
import type { GameKey } from "../content"
import type { Kit, Station } from "./kit"
import type { Callouts } from "./rocket"

export type StationFactory = (
  parent: THREE.Object3D,
  kit: Kit,
  slot: number,
  callouts: Callouts,
) => Station

/**
 * Les stations 3D des jeux. Toutes font partie du site : afficher ou masquer un jeu ne demande aucun
 * déploiement, seule la création d'une nouvelle station en demande un. Chacune est un fichier à part
 * (import dynamique) : on ne télécharge d'abord que celles des jeux à l'affiche.
 */
export const STATION_MODELS: Record<GameKey, () => Promise<StationFactory>> = {
  apex: () => import("./apex").then((m) => m.createApex),
  rocket: () => import("./rocket").then((m) => m.createRocket),
  aniimo: () => import("./aniimo").then((m) => m.createAniimo),
  league: () => import("./lol").then((m) => m.createLol),
  aion: () => import("./aion").then((m) => m.createAion),
  valorant: () => import("./valorant").then((m) => m.createValorant),
  genshin: () => import("./genshin").then((m) => m.createGenshin),
  cities: () => import("./cities").then((m) => m.createCities),
  summoners: () => import("./summoners").then((m) => m.createSummoners),
  ffxiii: () => import("./ffxiii").then((m) => m.createFfxiii),
  fortnite: () => import("./fortnite").then((m) => m.createFortnite),
}

type Connection = { saveData?: boolean; effectiveType?: string }

/**
 * Une fois la page affichée, télécharge les autres stations en tâche de fond : un jeu qui apparaît
 * ensuite (bandeau « Nouveau ») s'affiche sans attente. Rien sur connexion lente ou en économie de données.
 */
export function prefetchStations() {
  const connection = (navigator as Navigator & { connection?: Connection })
    .connection
  if (connection?.saveData || /2g|3g/.test(connection?.effectiveType ?? ""))
    return
  const run = () => {
    for (const load of Object.values(STATION_MODELS)) load().catch(() => {})
  }
  if ("requestIdleCallback" in window) window.requestIdleCallback(run)
  else setTimeout(run, 2000)
}
