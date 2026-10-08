import { randomUUID } from "node:crypto"
import { compareAccounts, DIRECTORY, type GameAccountInput } from "@k2/shared"
import { transaction, type Database } from "../../db/database"
import { notFound } from "../../lib/http-error"
import type { UsersRepository } from "../users/users.repository"
import type { AccountsRepository } from "./accounts.repository"

export function createAccountsService(
  db: Database,
  accounts: AccountsRepository,
  users: UsersRepository,
) {
  return {
    listMine(userId: string) {
      return accounts.listByUser(userId)
    },

    /**
     * Remplace tous les comptes du membre par `inputs`.
     * Les ids existants sont conservés ; la date de rang n'avance que si le rang change.
     */
    replaceMine(userId: string, inputs: GameAccountInput[]) {
      const existing = new Map(accounts.listByUser(userId).map((a) => [a.id, a]))
      const now = new Date().toISOString()

      transaction(db, () => {
        accounts.deleteByUser(userId)
        for (const input of inputs) {
          const previous = input.id ? existing.get(input.id) : undefined
          const rankChanged =
            !previous ||
            previous.rankTier !== input.rankTier ||
            previous.rankDivision !== (input.rankDivision ?? null) ||
            previous.rankLp !== (input.rankLp ?? null)

          accounts.insert(userId, {
            id: previous?.id ?? randomUUID(),
            slug: input.slug,
            identifier: input.identifier,
            url: input.url || null,
            friendCode: input.friendCode || null,
            isMain: input.isMain,
            rankTier: input.rankTier,
            rankDivision: input.rankDivision ?? null,
            rankLp: input.rankLp ?? null,
            rankUpdatedAt: rankChanged ? now : previous.rankUpdatedAt,
            rankDeclared: rankChanged ? true : previous.rankDeclared,
          })
        }
      })

      return accounts.listByUser(userId)
    },

    listDirectory() {
      const counts = accounts.countMembersBySlug()
      return DIRECTORY.map((entry) => ({ ...entry, memberCount: counts[entry.slug] ?? 0 }))
    },

    listByGame(slug: string) {
      return accounts.listBySlug(slug).sort(compareAccounts)
    },

    getMember(pseudo: string) {
      const user = users.findByPseudo(pseudo)
      if (!user) throw notFound("Membre introuvable")
      return {
        pseudo: user.pseudo,
        accounts: accounts.listByUser(user.id).sort(compareAccounts),
      }
    },
  }
}

export type AccountsService = ReturnType<typeof createAccountsService>
