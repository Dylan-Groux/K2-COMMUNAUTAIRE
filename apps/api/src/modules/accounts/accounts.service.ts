import { compareAccounts, DIRECTORY } from "@k2/shared"
import { notFound } from "../../lib/http-error"
import type { UsersRepository } from "../users/users.repository"
import type { AccountsRepository } from "./accounts.repository"

export function createAccountsService(accounts: AccountsRepository, users: UsersRepository) {
  return {
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
