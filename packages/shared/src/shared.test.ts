import { describe, expect, it } from "vitest"
import {
  compareAccounts,
  isAllowedTrackerUrl,
  rankClass,
  rankScore,
  registerSchema,
  saveAccountsSchema,
} from "./index"

describe("rankScore", () => {
  it("classe les rangs connus du plus haut au plus bas", () => {
    expect(rankScore({ rankTier: "Diamond" })).toBeGreaterThan(rankScore({ rankTier: "Emerald" }))
  })

  it("départage avec les LP", () => {
    expect(rankScore({ rankTier: "Or", rankLp: 50 })).toBeGreaterThan(
      rankScore({ rankTier: "Or", rankLp: 10 }),
    )
  })

  it("place un rang inconnu ou non classé tout en bas", () => {
    expect(rankScore({ rankTier: "Non classé" })).toBe(0)
    expect(rankScore({ rankTier: "Niveau 42" })).toBeLessThan(rankScore({ rankTier: "Bronze" }))
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
    expect(isAllowedTrackerUrl("valorant", "https://tracker.gg/valorant/x")).toBe(true)
    expect(isAllowedTrackerUrl("steam", "https://steamcommunity.com/id/nox")).toBe(true)
  })

  it("refuse les domaines étrangers ou trompeurs", () => {
    expect(isAllowedTrackerUrl("valorant", "https://evil.com/tracker.gg")).toBe(false)
    expect(isAllowedTrackerUrl("valorant", "https://nottracker.gg/")).toBe(false)
    expect(isAllowedTrackerUrl("aniimo", "https://tracker.gg/")).toBe(false)
  })
})

describe("registerSchema", () => {
  it("normalise l'email et ignore un téléphone vide", () => {
    const parsed = registerSchema.parse({
      email: "  Nox@K2.GG ",
      pseudo: "nox_92",
      phone: "",
      password: "motdepasse",
    })
    expect(parsed.email).toBe("nox@k2.gg")
    expect(parsed.phone).toBeUndefined()
  })
})

describe("saveAccountsSchema", () => {
  const base = { identifier: "x", rankTier: "Or" }

  it("refuse deux comptes principaux pour le même jeu", () => {
    const result = saveAccountsSchema.safeParse({
      accounts: [
        { ...base, slug: "valorant", isMain: true },
        { ...base, slug: "valorant", isMain: true },
      ],
    })
    expect(result.success).toBe(false)
  })

  it("refuse un smurf sans compte principal", () => {
    const result = saveAccountsSchema.safeParse({
      accounts: [{ ...base, slug: "valorant", isMain: false }],
    })
    expect(result.success).toBe(false)
  })

  it("refuse un lien tracker hors domaine", () => {
    const result = saveAccountsSchema.safeParse({
      accounts: [{ ...base, slug: "valorant", isMain: true, url: "https://evil.com" }],
    })
    expect(result.success).toBe(false)
  })
})
