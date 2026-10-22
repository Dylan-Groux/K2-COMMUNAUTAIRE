/** Contenu de l'accueil immersif : une « station » 3D par section, sur un axe vertical. */
import { hueOf } from "./components/Avatar"

export type GameKey =
  | "apex"
  | "rocket"
  | "aniimo"
  | "league"
  | "aion"
  | "valorant"
  | "genshin"
  | "cities"
  | "summoners"
  | "ffxiii"
  | "fortnite"
  | "rematch"

type TrackedGame = {
  match: RegExp
  color: string
  hex: number
  label: string
  /** Libellé court de la navigation et mots géants derrière la station. */
  nav: string
  words: [string, string]
  /** Panneau à droite sur grand écran, quand l'animation occupe la gauche. */
  panelRight?: boolean
}

/** Jeux qui ont leur station 3D (scene/registry.ts), détectés par le nom d'activité Discord / Steam. */
export const TRACKED_GAMES: Record<GameKey, TrackedGame> = {
  apex: {
    match: /apex/i,
    color: "var(--apex)",
    hex: 0xff4d3a,
    label: "Apex Legends",
    nav: "Apex",
    words: ["Drop", "Apex"],
  },
  rocket: {
    match: /rocket league/i,
    color: "var(--rl)",
    hex: 0x3aa0ff,
    label: "Rocket League",
    nav: "Rocket League",
    words: ["Boost", "Rocket"],
    panelRight: true,
  },
  aniimo: {
    match: /aniimo/i,
    color: "var(--aniimo)",
    hex: 0x6fe0a8,
    label: "Aniimo",
    nav: "Aniimo",
    words: ["Capture", "Aniimo"],
  },
  league: {
    match: /league of legends/i,
    color: "var(--lol)",
    hex: 0xd4ad55,
    label: "League of Legends",
    nav: "LoL",
    words: ["Nexus", "LoL"],
  },
  aion: {
    match: /\baion\b/i,
    color: "var(--aion)",
    hex: 0xb38cff,
    label: "AION 2",
    nav: "AION 2",
    words: ["Envol", "Aion"],
  },
  valorant: {
    match: /valorant/i,
    color: "var(--valorant)",
    hex: 0xff4f6e,
    label: "VALORANT",
    nav: "Valorant",
    words: ["Spike", "Valo"],
  },
  genshin: {
    match: /genshin impact/i,
    color: "var(--genshin)",
    hex: 0xb9e86b,
    label: "Genshin Impact",
    nav: "Genshin",
    words: ["Teyvat", "Genshin"],
  },
  cities: {
    match: /cities:? skylines/i,
    color: "var(--cities)",
    hex: 0xffa94d,
    label: "Cities: Skylines II",
    nav: "Cities II",
    words: ["Bâtis", "Cities"],
  },
  summoners: {
    match: /summoners war/i,
    color: "var(--summoners)",
    hex: 0xff6fd8,
    label: "Summoners War",
    nav: "Summoners War",
    words: ["Invoque", "Runes"],
  },
  ffxiii: {
    // XIII seul : XIII-2 et Lightning Returns sont d'autres jeux.
    match: /^final fantasy xiii$/i,
    color: "var(--ffxiii)",
    hex: 0xdde7ff,
    label: "FINAL FANTASY XIII",
    nav: "FF XIII",
    words: ["Cristal", "FF XIII"],
  },
  fortnite: {
    match: /fortnite/i,
    color: "var(--fortnite)",
    hex: 0xffe14d,
    label: "Fortnite",
    nav: "Fortnite",
    words: ["Build", "Fortnite"],
  },
  rematch: {
    match: /\brematch\b/i,
    color: "var(--rematch)",
    hex: 0x6c7bff,
    label: "Rematch",
    nav: "Rematch",
    words: ["Frappe", "Rematch"],
  },
}

export const GAME_KEYS = Object.keys(TRACKED_GAMES) as GameKey[]

export function gameKeyOf(name: string | null | undefined): GameKey | null {
  if (!name) return null
  return GAME_KEYS.find((key) => TRACKED_GAMES[key].match.test(name)) ?? null
}

/**
 * Couleur d'un jeu : celle du jeu suivi, sinon une teinte stable dérivée de son nom.
 * `color` pour le CSS, `hex` pour Three.js (qui ne lit pas les variables CSS).
 */
export function gameColorOf(name: string): {
  color: string
  hex: number | string
} {
  const key = gameKeyOf(name)
  if (key) return TRACKED_GAMES[key]
  const color = `hsl(${hueOf(name.toLowerCase())}, 70%, 68%)`
  return { color, hex: color }
}

/** Une section du scroll. `words` = mots géants derrière la scène, `solo` = un seul mot sur grand écran. */
export type StationView = {
  id: string
  nav: string
  accent: string
  words: [string, string]
  solo?: boolean
  panelRight?: boolean
}

/** Accueil, Top 48 h et Rejoindre sont toujours là ; entre les deux, les jeux joués en ce moment (stations.ts). */
export const HOME_STATION: StationView = {
  id: "home",
  nav: "Accueil",
  accent: "var(--cyan)",
  words: ["QSL", "le QG"],
  solo: true,
}
export const HYPE_STATION: StationView = {
  id: "hype",
  nav: "Top 48 h",
  accent: "var(--signal)",
  words: ["Hype", "48 h"],
}
/** Affichée à la place des jeux quand personne ne joue. */
export const IDLE_STATION: StationView = {
  id: "idle",
  nav: "En veille",
  accent: "var(--cyan)",
  words: ["Repasse", "ce soir"],
}
export const JOIN_STATION: StationView = {
  id: "join",
  nav: "Rejoindre",
  accent: "var(--signal)",
  words: ["Rejoins", "la partie"],
  solo: true,
}

/** Texte des jeux qui ont leur station. Un jeu sans station a un panneau générique (Panels.tsx). */
export const GAME_PANELS: Record<
  GameKey,
  { title: string; text: string; chips: string[] }
> = {
  apex: {
    title: "Battle royale nerveux, à jouer en squad.",
    text: "Trois légendes, des compétences qui se complètent et une zone qui se referme. Le jeu le plus joué du serveur, en casual comme en ranked.",
    chips: ["Battle royale", "Trio", "Free-to-play"],
  },
  rocket: {
    title: "Du foot, des voitures et des flip resets.",
    text: "Des matchs de cinq minutes où chaque but peut se jouer dans les airs. Facile à prendre en main, presque impossible à maîtriser.",
    chips: ["Sport", "1v1 · 2v2 · 3v3", "Free-to-play"],
  },
  aniimo: {
    title: "Un monde ouvert à explorer et des créatures à capturer.",
    text: "On parcourt les terres, on capture et on fait évoluer ses Aniimo, seul ou en coop avec les autres membres du serveur.",
    chips: ["Monde ouvert", "Capture", "Coop"],
  },
  league: {
    title: "Le MOBA de référence, en 5v5.",
    text: "Plus de 160 champions, trois lanes et un Nexus à détruire. Des parties normales pour s’amuser aux ranked pour grimper.",
    chips: ["MOBA", "5v5", "Free-to-play"],
  },
  aion: {
    title: "Un MMORPG où l'on se bat jusque dans le ciel.",
    text: "Le MMORPG de NCSOFT : des Daevas ailés, des îles suspendues à explorer et des donjons à faire en groupe.",
    chips: ["MMORPG", "Vol", "Groupe"],
  },
  valorant: {
    title: "Du 5v5 tactique où chaque balle compte.",
    text: "Le FPS de Riot Games : des agents aux capacités uniques, une Spike à poser ou à désamorcer, et des rounds qui se jouent à un tir près.",
    chips: ["FPS tactique", "5v5", "Free-to-play"],
  },
  genshin: {
    title: "Un monde ouvert à parcourir, seul ou à quatre.",
    text: "Le RPG d'action de HoYoverse : le continent de Teyvat, sept éléments qui se combinent en réactions, et de la coop jusqu'à quatre joueurs.",
    chips: ["RPG d'action", "Monde ouvert", "Free-to-play"],
  },
  cities: {
    title: "Une ville à construire, rue après rue.",
    text: "Le city-builder de Colossal Order : zoner les quartiers, tracer les routes, gérer la circulation et regarder la ville grandir.",
    chips: ["Gestion", "City-builder", "Solo"],
  },
  summoners: {
    title: "Des monstres à invoquer et des runes à optimiser.",
    text: "Le RPG au tour par tour de Com2uS : invoquer des monstres de cinq éléments, leur équiper des runes et les envoyer dans l'arène.",
    chips: ["Tour par tour", "Mobile", "PvP"],
  },
  ffxiii: {
    title: "Un RPG entre deux mondes, Cocoon et Gran Pulse.",
    text: "L'épisode de Square Enix mené par Lightning : le monde suspendu de Cocoon, les terres sauvages de Gran Pulse et des combats rythmés par les changements de stratégie.",
    chips: ["RPG", "Solo", "Square Enix"],
  },
  fortnite: {
    title: "Cent joueurs, une île et de quoi construire.",
    text: "Le battle royale d'Epic Games : on saute du bus, on construit pour se protéger et on tient jusqu'à la dernière place.",
    chips: ["Battle royale", "Construction", "Free-to-play"],
  },
  rematch: {
    title: "Du foot en 5 contre 5, un joueur chacun.",
    text: "Le jeu de foot de Sloclap : chacun contrôle un seul joueur, sans faute ni hors-jeu, sur un terrain fermé où le ballon rebondit sur les murs.",
    chips: ["Foot", "5v5", "Multijoueur"],
  },
}

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
/** Serveur Discord QSL (« Qui se Lave ICI ???? »). Public : c'est l'ID que donne n'importe quelle invitation. */
export const DISCORD_GUILD_ID =
  import.meta.env.VITE_DISCORD_GUILD_ID || "1008446090506403951"
/** Le bot QSL (VITE_WIDGET_URL) prime sur le widget public : vrais pseudos, toutes les photos. */
export const WIDGET_URL =
  import.meta.env.VITE_WIDGET_URL ||
  (DISCORD_GUILD_ID
    ? `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/widget.json`
    : "")
export const STATS_URL = import.meta.env.VITE_STATS_URL || ""
/** Jeux joués en ce moment, écrits chaque minute par le bot (live.json). Vide = données d'exemple. */
export const LIVE_URL = import.meta.env.VITE_LIVE_URL || ""
