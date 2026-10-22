import {
  GAME_KEYS,
  gameColorOf,
  HOME_STATION,
  HYPE_STATION,
  IDLE_STATION,
  JOIN_STATION,
  TRACKED_GAMES,
  type StationView,
} from "./content"
import type { LineupGame } from "./data/live"

/** Section d'un jeu : celle du jeu suivi, sinon une section générique à sa couleur. */
export type GameStation = StationView & { game: LineupGame }

export const isGameStation = (s: StationView): s is GameStation => "game" in s

function gameStation(game: LineupGame): GameStation {
  if (game.key) {
    const { nav, color, words, panelRight } = TRACKED_GAMES[game.key]
    return { id: game.id, nav, accent: color, words, panelRight, game }
  }
  return {
    id: game.id,
    nav: game.name,
    accent: gameColorOf(game.name).color,
    // Le nom peut être long (« Tom Clancy's The Division 2 ») : il est déjà sur l'enseigne et le panneau.
    words: ["En jeu", "Live"],
    game,
  }
}

/**
 * Page /station : toutes les stations à la suite, sans attendre qu'on joue à ces jeux.
 * Un jeu fictif montre la station générique, et la veille termine la liste.
 */
export function buildShowcase(): StationView[] {
  const games: LineupGame[] = GAME_KEYS.map((key) => ({
    id: key,
    name: TRACKED_GAMES[key].label,
    key,
    players: null,
  }))
  games.push({
    id: "exemple",
    name: "Exemple",
    key: null,
    players: null,
  })
  return [
    HOME_STATION,
    HYPE_STATION,
    ...games.map(gameStation),
    IDLE_STATION,
    JOIN_STATION,
  ]
}

/**
 * Sections dans l'ordre du scroll : Accueil et Top 48 h, les jeux joués en ce moment
 * (ou la station de veille si personne ne joue), puis Rejoindre.
 * `games` null : les données ne sont pas encore arrivées, on n'affiche aucune section de jeu.
 */
export function buildStations(games: LineupGame[] | null): StationView[] {
  const middle =
    games === null ? [] : games.length ? games.map(gameStation) : [IDLE_STATION]
  return [HOME_STATION, HYPE_STATION, ...middle, JOIN_STATION]
}
