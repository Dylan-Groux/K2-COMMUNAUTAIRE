import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { STATS_URL } from "../content"

export type GameStat = { name: string; hours: number; players: number }
export type HypeStats = {
  window_hours: number
  role: string
  games: GameStat[]
}

export const DEMO_STATS: HypeStats = {
  window_hours: 48,
  role: "Joueurs",
  games: [
    { name: "Apex Legends", hours: 37.5, players: 14 },
    { name: "League of Legends", hours: 29.2, players: 9 },
    { name: "Rocket League", hours: 18.4, players: 7 },
    { name: "Aniimo", hours: 12.1, players: 6 },
    { name: "Minecraft", hours: 6.3, players: 4 },
    { name: "Valorant", hours: 3.8, players: 2 },
  ],
}

/** Heures × √joueurs : un jeu joué par beaucoup de monde passe devant un jeu farmé par une seule personne. */
export const hypeScore = (g: GameStat) => g.hours * Math.sqrt(g.players)

export const rankGames = (games: GameStat[]) =>
  games.slice().sort((a, b) => hypeScore(b) - hypeScore(a))

export const formatHours = (hours: number) =>
  `${hours.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} h`

async function fetchStats(): Promise<HypeStats> {
  const response = await fetch(STATS_URL)
  if (!response.ok) throw new Error(`Stats indisponibles (${response.status})`)
  return response.json()
}

export function useHypeStats() {
  const live = useQuery({
    queryKey: ["hype-stats"],
    queryFn: fetchStats,
    enabled: !!STATS_URL,
    retry: false,
  })
  const stats = live.data ?? DEMO_STATS
  const ranked = useMemo(() => rankGames(stats.games), [stats])
  return { stats, ranked, isDemo: !live.data }
}
