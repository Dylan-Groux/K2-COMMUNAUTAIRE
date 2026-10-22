import { describe, expect, it } from "vitest"
import { gameColorOf, gameKeyOf, todayIndex } from "./content"
import {
  countByGame,
  DEMO_WIDGET,
  sortMembers,
  voiceChannels,
} from "./data/discord"
import { rankGames } from "./data/hype"
import {
  buildLineup,
  FALLBACK_LINEUP,
  newGames,
  STALE_MS,
  type LiveData,
} from "./data/live"
import {
  activeStation,
  CENTERS,
  layoutWindows,
  sceneAlpha,
  setStationCount,
  snapTarget,
  WINDOWS,
} from "./scroll"
import { buildStations } from "./stations"

describe("scroll", () => {
  it.each([4, 6, 7])(
    "avec %i stations, chacune est pleinement visible à son centre",
    (count) => {
      setStationCount(count)
      CENTERS.forEach((v, i) => {
        expect(sceneAlpha(i, v)).toBe(1)
        expect(activeStation(v)).toBe(i)
      })
    },
  )

  it("une station est invisible loin de sa fenêtre", () => {
    setStationCount(7)
    expect(sceneAlpha(2, WINDOWS[4][0])).toBe(0)
    expect(sceneAlpha(0, 0.5)).toBe(0)
  })

  it("toutes les stations du milieu ont la même durée", () => {
    const widths = layoutWindows(6)
      .slice(1, -1)
      .map(([a, b]) => +(b - a).toFixed(6))
    expect(new Set(widths).size).toBe(1)
  })

  it("aimante vers la station suivante dans le sens du scroll", () => {
    setStationCount(5)
    const gap = (WINDOWS[1][1] + WINDOWS[2][0]) / 2
    expect(snapTarget(gap, 1)).toBe(2)
    expect(snapTarget(gap, -1)).toBe(1)
    expect(snapTarget(CENTERS[2], 1)).toBeNull()
  })
})

describe("stations à l'affiche", () => {
  const now = 1_000_000_000
  const live = (games: LiveData["games"]): LiveData => ({
    updated_at: now,
    games,
  })

  it("trie par joueurs, fusionne les doublons de casse et garde 4 jeux", () => {
    const lineup = buildLineup(
      live([
        { name: "Rocket League", players: 1 },
        { name: "AION 2", players: 3 },
        { name: "Valorant", players: 1 },
        { name: "VALORANT", players: 1 },
        { name: "Apex Legends", players: 4 },
        { name: "Minecraft", players: 1 },
      ]),
      now,
    )
    expect(lineup.map((g) => [g.name, g.players])).toEqual([
      ["Apex Legends", 4],
      ["AION 2", 3],
      ["VALORANT", 2],
      ["Rocket League", 1],
    ])
    expect(lineup[1].key).toBe("aion")
    expect(lineup[2].key).toBe("valorant")
  })

  it("sans données récentes, montre les quatre jeux historiques", () => {
    expect(buildLineup(null, now)).toBe(FALLBACK_LINEUP)
    const old = { ...live([{ name: "AION 2", players: 2 }]) }
    expect(buildLineup(old, now + STALE_MS + 1)).toBe(FALLBACK_LINEUP)
  })

  it("personne en jeu : la station de veille remplace les jeux", () => {
    const stations = buildStations(buildLineup(live([]), now))
    expect(stations.map((s) => s.id)).toEqual(["home", "hype", "idle", "join"])
  })

  it("propose seulement les jeux nouveaux et joués en ce moment", () => {
    const shown = buildLineup(live([{ name: "Apex Legends", players: 2 }]), now)
    const latest = buildLineup(
      live([
        { name: "Apex Legends", players: 3 },
        { name: "AION 2", players: 3 },
        { name: "Minecraft", players: 0 },
      ]),
      now,
    )
    expect(newGames(shown, latest).map((g) => g.name)).toEqual(["AION 2"])
  })
})

describe("jeux suivis", () => {
  it("reconnaît les activités Discord", () => {
    expect(gameKeyOf("Apex Legends")).toBe("apex")
    expect(gameKeyOf("League of Legends")).toBe("league")
    expect(gameKeyOf("Spotify")).toBeNull()
  })

  it("donne une couleur à tous les jeux, stable pour un jeu non suivi", () => {
    expect(gameColorOf("Apex Legends").hex).toBe(0xff4d3a)
    expect(gameColorOf("Minecraft").color).toMatch(/^hsl\(\d+, 70%, 68%\)$/)
    expect(gameColorOf("MINECRAFT")).toEqual(gameColorOf("Minecraft"))
    expect(gameColorOf("Terraria").color).not.toBe(
      gameColorOf("Minecraft").color,
    )
  })

  it("lundi = 0, dimanche = 6", () => {
    expect(todayIndex(new Date("2026-10-05T12:00:00"))).toBe(0)
    expect(todayIndex(new Date("2026-10-11T12:00:00"))).toBe(6)
  })
})

describe("widget Discord", () => {
  it("compte les membres en jeu par jeu", () => {
    expect(countByGame(DEMO_WIDGET.members)).toEqual({
      apex: 4,
      rocket: 2,
      aniimo: 2,
      league: 3,
      aion: 0,
      valorant: 0,
      genshin: 0,
      cities: 0,
      summoners: 0,
      ffxiii: 0,
      fortnite: 0,
      rematch: 0,
    })
  })

  it("met les membres en jeu en premier", () => {
    const sorted = sortMembers(DEMO_WIDGET.members)
    expect(
      sorted
        .slice(0, 11)
        .every((m) => m.activity && m.activity.name !== "Spotify"),
    ).toBe(true)
    expect(sorted.slice(11).map((m) => m.username)).toEqual([
      "Mangue",
      "lunatique",
      "Zéphyr",
    ])
  })

  it("ne garde que les salons vocaux occupés", () => {
    const widget = {
      ...DEMO_WIDGET,
      channels: [
        ...DEMO_WIDGET.channels,
        { id: "v9", name: "Vide", position: 9 },
      ],
    }
    expect(voiceChannels(widget).map((c) => c.name)).toEqual([
      "Squad Apex",
      "Ranked LoL",
      "Chill",
    ])
  })
})

describe("jeu du moment", () => {
  it("classe par heures cumulées, quel que soit le nombre de joueurs", () => {
    const ranked = rankGames([
      { name: "Aniimo", hours: 7.2, players: 3 },
      { name: "Valorant", hours: 9.5, players: 1 },
      { name: "Groupe", hours: 12, players: 9 },
    ])
    expect(ranked.map((g) => g.name)).toEqual(["Groupe", "Valorant", "Aniimo"])
  })

  it("ne modifie pas la liste reçue", () => {
    const games = [
      { name: "A", hours: 1, players: 1 },
      { name: "B", hours: 2, players: 1 },
    ]
    rankGames(games)
    expect(games[0].name).toBe("A")
  })
})
