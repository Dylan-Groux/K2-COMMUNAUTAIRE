import { describe, expect, it } from "vitest"
import { filterSteam } from "./components/SteamDrawer"
import { gameKeyOf, todayIndex } from "./content"
import {
  countByGame,
  DEMO_WIDGET,
  sortMembers,
  voiceChannels,
} from "./data/discord"
import { rankGames } from "./data/hype"
import {
  DEMO_STEAM,
  friendCodeFromSteamId,
  steamIdFromUrl,
  toSteamMember,
} from "./data/steam"
import { activeStation, CENTERS, sceneAlpha, WINDOWS } from "./scroll"

describe("scroll", () => {
  it("chaque station est pleinement visible à son centre", () => {
    CENTERS.forEach((v, i) => {
      expect(sceneAlpha(i, v)).toBe(1)
      expect(activeStation(v)).toBe(i)
    })
  })

  it("une station est invisible loin de sa fenêtre", () => {
    expect(sceneAlpha(2, WINDOWS[4][0])).toBe(0)
    expect(sceneAlpha(0, 0.5)).toBe(0)
  })
})

describe("jeux suivis", () => {
  it("reconnaît les activités Discord", () => {
    expect(gameKeyOf("Apex Legends")).toBe("apex")
    expect(gameKeyOf("League of Legends")).toBe("league")
    expect(gameKeyOf("Spotify")).toBeNull()
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
  it("préfère un jeu joué par beaucoup de monde", () => {
    const ranked = rankGames([
      { name: "Solo", hours: 20, players: 1 },
      { name: "Groupe", hours: 12, players: 9 },
    ])
    expect(ranked[0].name).toBe("Groupe")
  })
})

describe("Steam", () => {
  it("convertit un SteamID64 en code ami", () => {
    expect(friendCodeFromSteamId("76561198144486659")).toBe("184220931")
    expect(friendCodeFromSteamId("pas-un-id")).toBeNull()
  })

  it("lit le SteamID dans l'URL du profil", () => {
    expect(
      steamIdFromUrl("https://steamcommunity.com/profiles/76561198144486659/"),
    ).toBe("76561198144486659")
    expect(steamIdFromUrl("https://steamcommunity.com/id/redar")).toBeNull()
  })

  it("transforme un compte K2 en carte Steam", () => {
    const member = toSteamMember({
      id: "a1",
      userId: "u1",
      pseudo: "Redar",
      game: "Steam",
      slug: "steam",
      identifier: "redar",
      url: "https://steamcommunity.com/profiles/76561198144486659",
      friendCode: null,
      isMain: true,
      rankTier: "",
      rankDivision: null,
      rankLp: null,
      rankUpdatedAt: "",
      rankDeclared: true,
    })
    expect(member).toMatchObject({
      discord: "Redar",
      persona: "redar",
      friendCode: "184220931",
    })
  })

  it("filtre par pseudo et par jeu en cours", () => {
    expect(
      filterSteam(DEMO_STEAM, "okono", "all").map((m) => m.discord),
    ).toEqual(["Oko"])
    expect(filterSteam(DEMO_STEAM, "", "apex").map((m) => m.discord)).toEqual([
      "Kaelyx",
      "nova.wav",
    ])
  })
})
