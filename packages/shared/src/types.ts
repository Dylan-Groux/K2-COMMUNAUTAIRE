export type GameAccount = {
  id: string
  userId: string
  pseudo: string
  game: string
  slug: string
  identifier: string
  url: string | null
  friendCode: string | null
  isMain: boolean
  rankTier: string
  rankDivision: string | null
  rankLp: number | null
  rankUpdatedAt: string
  rankDeclared: boolean
}

export type DirectoryGame = {
  slug: string
  label: string
  short: string
  memberCount: number
}

export type Member = {
  pseudo: string
  accounts: GameAccount[]
}

export type ApiError = {
  error: string
  details?: unknown
}
