export type GameDefinition = {
  slug: string
  name: string
  short: string
  /** Domaines acceptés pour les liens tracker / profil. Vide = aucun lien accepté. */
  trackerDomains: string[]
}

/** Jeux qu'un membre peut renseigner sur son profil, dans l'ordre d'affichage. */
export const GAMES: GameDefinition[] = [
  { slug: "steam", name: "Steam", short: "PC", trackerDomains: ["steamcommunity.com"] },
  { slug: "epic-games", name: "Epic Games", short: "EG", trackerDomains: [] },
  { slug: "valorant", name: "Valorant", short: "VAL", trackerDomains: ["tracker.gg"] },
  { slug: "league-of-legends", name: "League of Legends", short: "LOL", trackerDomains: ["tracker.gg"] },
  { slug: "apex-legends", name: "Apex Legends", short: "APX", trackerDomains: ["apex.tracker.gg"] },
  { slug: "rocket-league", name: "Rocket League", short: "RL", trackerDomains: ["rocketleague.tracker.network"] },
  { slug: "aniimo", name: "Aniimo", short: "ANI", trackerDomains: [] },
  { slug: "aion-2", name: "Aion 2", short: "A2", trackerDomains: [] },
]

/** Entrées du répertoire public /jeux. */
export const DIRECTORY: { slug: string; label: string; short: string }[] = [
  { slug: "valorant", label: "Valorant", short: "VAL" },
  { slug: "league-of-legends", label: "League of Legends", short: "LOL" },
  { slug: "apex-legends", label: "Apex Legends", short: "APX" },
  { slug: "rocket-league", label: "Rocket League", short: "RL" },
  { slug: "aniimo", label: "Aniimo", short: "ANI" },
  { slug: "aion-2", label: "Aion 2", short: "A2" },
  { slug: "steam", label: "Steam / Epic", short: "PC" },
]

export const GAME_SLUGS = GAMES.map((game) => game.slug)

export const findGame = (slug: string) => GAMES.find((game) => game.slug === slug)

export const directoryLabel = (slug: string) =>
  DIRECTORY.find((entry) => entry.slug === slug)?.label ?? findGame(slug)?.name

export const isUrl = (value: string) => /^https?:\/\//i.test(value.trim())

/** Vrai si l'URL pointe vers un domaine autorisé (ou un sous-domaine) pour ce jeu. */
export function isAllowedTrackerUrl(slug: string, value: string) {
  const domains = findGame(slug)?.trackerDomains ?? []
  try {
    const { hostname, protocol } = new URL(value)
    if (protocol !== "https:" && protocol !== "http:") return false
    return domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
  } catch {
    return false
  }
}
