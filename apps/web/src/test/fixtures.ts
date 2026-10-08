import type { GameAccount } from "@k2/shared"

let id = 0

export const account = (overrides: Partial<GameAccount> = {}): GameAccount => ({
  id: `acc-${id++}`,
  userId: "user-1",
  pseudo: "RedarDG",
  game: "League of Legends",
  slug: "league-of-legends",
  identifier: "SOREDAR#EUW",
  url: null,
  friendCode: null,
  isMain: true,
  rankTier: "Diamond",
  rankDivision: "II",
  rankLp: 64,
  rankUpdatedAt: "2026-10-01T10:00:00.000Z",
  rankDeclared: false,
  ...overrides,
})

export const user = { id: "user-1", email: "redar@k2.gg", pseudo: "RedarDG" }
