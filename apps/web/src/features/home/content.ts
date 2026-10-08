/** Contenu de l'accueil immersif : une « station » 3D par section, sur un axe vertical. */

export type GameKey = "apex" | "rocket" | "aniimo" | "league"

/** Jeux suivis, détectés par le nom d'activité Discord / Steam. */
export const TRACKED_GAMES: Record<
  GameKey,
  { match: RegExp; color: string; hex: number; label: string }
> = {
  apex: {
    match: /apex/i,
    color: "var(--apex)",
    hex: 0xff4d3a,
    label: "Apex Legends",
  },
  rocket: {
    match: /rocket league/i,
    color: "var(--rl)",
    hex: 0x3aa0ff,
    label: "Rocket League",
  },
  aniimo: {
    match: /aniimo/i,
    color: "var(--aniimo)",
    hex: 0x6fe0a8,
    label: "Aniimo",
  },
  league: {
    match: /league of legends/i,
    color: "var(--lol)",
    hex: 0xd4ad55,
    label: "League of Legends",
  },
}

export const GAME_KEYS = Object.keys(TRACKED_GAMES) as GameKey[]

export function gameKeyOf(name: string | null | undefined): GameKey | null {
  if (!name) return null
  return GAME_KEYS.find((key) => TRACKED_GAMES[key].match.test(name)) ?? null
}

/** Sections dans l'ordre du scroll. `words` = mots géants derrière la scène. */
export const STATIONS = [
  { nav: "Accueil", accent: "var(--cyan)", words: ["QLS", "le QG"] },
  { nav: "Top 48 h", accent: "var(--signal)", words: ["Hype", "48 h"] },
  { nav: "Apex", accent: "var(--apex)", words: ["Drop", "Apex"] },
  { nav: "Rocket League", accent: "var(--rl)", words: ["Boost", "Rocket"] },
  { nav: "Aniimo", accent: "var(--aniimo)", words: ["Capture", "Aniimo"] },
  { nav: "LoL", accent: "var(--lol)", words: ["Nexus", "LoL"] },
  {
    nav: "Rejoindre",
    accent: "var(--signal)",
    words: ["Rejoins", "la partie"],
  },
] as const

export const JOIN_STATION = STATIONS.length - 1

export const GAME_PANELS: {
  station: number
  game: GameKey
  eyebrow: string
  title: string
  text: string
  chips: string[]
}[] = [
  {
    station: 2,
    game: "apex",
    eyebrow: "01 · Apex Legends",
    title: "Battle royale nerveux, à jouer en squad.",
    text: "Trois légendes, des compétences qui se complètent et une zone qui se referme. Le jeu le plus joué du serveur, en casual comme en ranked.",
    chips: ["Battle royale", "Trio", "Free-to-play"],
  },
  {
    station: 3,
    game: "rocket",
    eyebrow: "02 · Rocket League",
    title: "Du foot, des voitures et des flip resets.",
    text: "Des matchs de cinq minutes où chaque but peut se jouer dans les airs. Facile à prendre en main, presque impossible à maîtriser.",
    chips: ["Sport", "1v1 · 2v2 · 3v3", "Free-to-play"],
  },
  {
    station: 4,
    game: "aniimo",
    eyebrow: "03 · Aniimo",
    title: "Un monde ouvert à explorer et des créatures à capturer.",
    text: "On parcourt les terres, on capture et on fait évoluer ses Aniimo, seul ou en coop avec les autres membres du serveur.",
    chips: ["Monde ouvert", "Capture", "Coop"],
  },
  {
    station: 5,
    game: "league",
    eyebrow: "04 · League of Legends",
    title: "Le MOBA de référence, en 5v5.",
    text: "Plus de 160 champions, trois lanes et un Nexus à détruire. Des parties normales pour s’amuser aux ranked pour grimper.",
    chips: ["MOBA", "5v5", "Free-to-play"],
  },
]

/** Le serveur est actif tous les soirs ; vendredi et samedi, plus de monde et plus tard. */
export const ACTIVE_HOURS = "18:30 – 00:00"
export const PEAK_HOURS = "18:30 – 02:00"

export const SCHEDULE: { day: string; peak?: boolean }[] = [
  { day: "Lun" },
  { day: "Mar" },
  { day: "Mer" },
  { day: "Jeu" },
  { day: "Ven", peak: true },
  { day: "Sam", peak: true },
  { day: "Dim" },
]

/** Index du jour courant dans SCHEDULE (lundi = 0). */
export const todayIndex = (date = new Date()) => (date.getDay() + 6) % 7

/**
 * Discord : Paramètres du serveur → Widget → « Activer le widget du serveur », puis copier l'ID.
 * Stats : endpoint du bot → { window_hours, role, games: [{ name, hours, players }] }.
 * Vides = données d'exemple.
 */
export const DISCORD_GUILD_ID = import.meta.env.VITE_DISCORD_GUILD_ID || ""
/** Le bot QLS (VITE_WIDGET_URL) prime sur le widget public : vrais pseudos, toutes les photos. */
export const WIDGET_URL =
  import.meta.env.VITE_WIDGET_URL ||
  (DISCORD_GUILD_ID
    ? `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/widget.json`
    : "")
export const STATS_URL = import.meta.env.VITE_STATS_URL || ""
