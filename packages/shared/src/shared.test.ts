import { describe, expect, it } from "vitest"
import {
  compareAccounts,
  isAllowedTrackerUrl,
  rankClass,
  rankScore,
} from "./index"

describe("rankScore", () => {
  it("classe les rangs connus du plus haut au plus bas", () => {
    expect(rankScore({ rankTier: "Diamond" })).toBeGreaterThan(
      rankScore({ rankTier: "Emerald" }),
    )
  })

  it("départage avec les LP", () => {
    expect(rankScore({ rankTier: "Or", rankLp: 50 })).toBeGreaterThan(
      rankScore({ rankTier: "Or", rankLp: 10 }),
    )
  })

  it("place un rang inconnu ou non classé tout en bas", () => {
    expect(rankScore({ rankTier: "Non classé" })).toBe(0)
    expect(rankScore({ rankTier: "Niveau 42" })).toBeLessThan(
      rankScore({ rankTier: "Bronze" }),
    )
  })
})

describe("compareAccounts", () => {
  it("met les comptes principaux avant les smurfs", () => {
    const sorted = [
      { isMain: false, rankTier: "Radiant" },
      { isMain: true, rankTier: "Bronze" },
    ].sort(compareAccounts)
    expect(sorted[0].isMain).toBe(true)
  })
})

describe("rankClass", () => {
  it("produit une classe CSS sûre", () => {
    expect(rankClass("Diamond")).toBe("rank-diamond")
    expect(rankClass("Non classé")).toBe("rank-non-classe")
  })
})

describe("isAllowedTrackerUrl", () => {
  it("accepte le domaine et ses sous-domaines", () => {
    expect(
      isAllowedTrackerUrl("valorant", "https://tracker.gg/valorant/x"),
    ).toBe(true)
    expect(
      isAllowedTrackerUrl("steam", "https://steamcommunity.com/id/nox"),
    ).toBe(true)
  })

  it("refuse les domaines étrangers ou trompeurs", () => {
    expect(isAllowedTrackerUrl("valorant", "https://evil.com/tracker.gg")).toBe(
      false,
    )
    expect(isAllowedTrackerUrl("valorant", "https://nottracker.gg/")).toBe(
      false,
    )
    expect(isAllowedTrackerUrl("aniimo", "https://tracker.gg/")).toBe(false)
  })
})
