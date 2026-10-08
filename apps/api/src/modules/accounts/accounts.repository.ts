import { findGame, type GameAccount } from "@k2/shared"
import type { Database } from "../../db/database"

type AccountRow = {
  id: string
  user_id: string
  pseudo: string
  slug: string
  identifier: string
  url: string | null
  friend_code: string | null
  is_main: number
  rank_tier: string
  rank_division: string | null
  rank_lp: number | null
  rank_updated_at: string
  rank_declared: number
}

const SELECT = `
  SELECT a.*, u.pseudo FROM game_accounts a
  JOIN users u ON u.id = a.user_id
`

const toAccount = (row: AccountRow): GameAccount => ({
  id: row.id,
  userId: row.user_id,
  pseudo: row.pseudo,
  game: findGame(row.slug)?.name ?? row.slug,
  slug: row.slug,
  identifier: row.identifier,
  url: row.url,
  friendCode: row.friend_code,
  isMain: row.is_main === 1,
  rankTier: row.rank_tier,
  rankDivision: row.rank_division,
  rankLp: row.rank_lp,
  rankUpdatedAt: row.rank_updated_at,
  rankDeclared: row.rank_declared === 1,
})

export type NewAccountRow = Omit<GameAccount, "pseudo" | "game" | "userId">

export function createAccountsRepository(db: Database) {
  return {
    listByUser(userId: string) {
      const rows = db.prepare(`${SELECT} WHERE a.user_id = ?`).all(userId) as AccountRow[]
      return rows.map(toAccount)
    },

    listBySlug(slug: string) {
      const rows = db.prepare(`${SELECT} WHERE a.slug = ?`).all(slug) as AccountRow[]
      return rows.map(toAccount)
    },

    /** Nombre de membres distincts inscrits par jeu. */
    countMembersBySlug() {
      const rows = db
        .prepare("SELECT slug, COUNT(DISTINCT user_id) AS count FROM game_accounts GROUP BY slug")
        .all() as { slug: string; count: number }[]
      return Object.fromEntries(rows.map((row) => [row.slug, row.count])) as Record<string, number>
    },

    insert(userId: string, account: NewAccountRow) {
      db.prepare(
        `INSERT INTO game_accounts (id, user_id, slug, identifier, url, friend_code, is_main,
           rank_tier, rank_division, rank_lp, rank_updated_at, rank_declared)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).run(
        account.id,
        userId,
        account.slug,
        account.identifier,
        account.url,
        account.friendCode,
        account.isMain ? 1 : 0,
        account.rankTier,
        account.rankDivision,
        account.rankLp,
        account.rankUpdatedAt,
        account.rankDeclared ? 1 : 0,
      )
    },
  }
}

export type AccountsRepository = ReturnType<typeof createAccountsRepository>
