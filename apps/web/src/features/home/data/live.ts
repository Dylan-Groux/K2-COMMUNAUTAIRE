import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { gameKeyOf, LIVE_URL, TRACKED_GAMES, type GameKey } from "../content"

/** live.json du bot : jeux présents depuis plus de 3 min, ou quittés il y a moins de 15 min (players = 0). */
export type LiveData = {
  updated_at: number
  games: { name: string; players: number }[]
}

/** Un jeu à l'affiche. `key` = jeu qui a sa station 3D, sinon station générique. `players` null = inconnu. */
export type LineupGame = {
  id: string
  name: string
  key: GameKey | null
  players: number | null
}

export const MAX_STATIONS = 4
/** Au-delà, le bot ne réécrit plus le fichier : ses données ne disent plus ce qui se joue. */
export const STALE_MS = 5 * 60_000

const tracked = (key: GameKey, players: number | null): LineupGame => ({
  id: key,
  name: TRACKED_GAMES[key].label,
  key,
  players,
})

/** Sans données fiables (bot arrêté, fichier absent), on montre les quatre jeux historiques du serveur. */
export const FALLBACK_LINEUP: LineupGame[] = (
  ["apex", "rocket", "aniimo", "league"] as const
).map((key) => tracked(key, null))

/** Ton scénario de 21 h, pour travailler en local sans le bot. */
export const DEMO_LIVE: LiveData = {
  updated_at: Date.now(),
  games: [
    { name: "Apex Legends", players: 3 },
    { name: "AION 2", players: 3 },
    { name: "Rocket League", players: 1 },
  ],
}

/**
 * Jeux à l'affiche, du plus joué au moins joué, 4 au maximum. Liste vide = personne ne joue (station de veille).
 * Les noms qui désignent le même jeu (« Valorant » et « VALORANT ») sont fusionnés.
 */
export function buildLineup(
  data: LiveData | null | undefined,
  now = Date.now(),
): LineupGame[] {
  if (!data || now - data.updated_at > STALE_MS) return FALLBACK_LINEUP
  const byId = new Map<string, LineupGame>()
  for (const { name, players } of data.games) {
    const key = gameKeyOf(name)
    const id = key ?? name.trim().toLowerCase()
    const known = byId.get(id)
    if (known) known.players = (known.players ?? 0) + players
    else byId.set(id, key ? tracked(key, players) : { id, name, key, players })
  }
  return [...byId.values()]
    .sort((a, b) => (b.players ?? 0) - (a.players ?? 0))
    .slice(0, MAX_STATIONS)
}

/** Jeux de `latest` absents de `shown` et joués en ce moment : ce que propose le bandeau « Nouveau ». */
export const newGames = (shown: LineupGame[], latest: LineupGame[]) =>
  latest.filter(
    (game) => !!game.players && !shown.some((s) => s.id === game.id),
  )

async function fetchLive(): Promise<LiveData> {
  const response = await fetch(LIVE_URL)
  if (!response.ok)
    throw new Error(`Jeux en direct indisponibles (${response.status})`)
  return response.json()
}

/**
 * La liste des stations est figée au premier chargement : rien ne bouge pendant qu'on lit.
 * Les compteurs, eux, suivent les données relues chaque minute, et `fresh` liste les nouveaux jeux.
 */
export function useLiveLineup() {
  const live = useQuery({
    queryKey: ["live-games", LIVE_URL],
    queryFn: fetchLive,
    enabled: !!LIVE_URL,
    refetchInterval: 60_000,
    retry: false,
  })
  const settled = !LIVE_URL || !live.isPending
  const latest = useMemo(
    () =>
      !settled
        ? null
        : LIVE_URL
          ? buildLineup(live.data)
          : buildLineup(DEMO_LIVE, DEMO_LIVE.updated_at),
    [settled, live.data, live.dataUpdatedAt],
  )

  const [shown, setShown] = useState<LineupGame[] | null>(null)
  if (shown === null && latest) setShown(latest)

  return {
    /** null tant que la première réponse n'est pas arrivée. */
    games: shown,
    fresh: shown && latest ? newGames(shown, latest) : [],
    /** Joueurs en ce moment, pour un jeu de la liste affichée. */
    players: (id: string) =>
      latest?.find((game) => game.id === id)?.players ??
      (latest === FALLBACK_LINEUP ? null : 0),
    showLatest: () => latest && setShown(latest),
    isDemo: !LIVE_URL,
  }
}
