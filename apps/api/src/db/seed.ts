import { randomUUID } from "node:crypto"
import { pathToFileURL } from "node:url"
import {
  createAccountsRepository,
  type NewAccountRow,
} from "../modules/accounts/accounts.repository"
import { createUsersRepository } from "../modules/users/users.repository"
import { openDatabase, transaction, type Database } from "./database"

export const DEMO_PSEUDO = "RedarDG"

/** V1 : uniquement des liens (tracker, profil Steam) ou des codes amis, pas de rang. */
type SeedAccount = Pick<NewAccountRow, "slug" | "identifier" | "isMain"> &
  Partial<Pick<NewAccountRow, "url" | "friendCode">>

type SeedMember = { pseudo: string; accounts: SeedAccount[] }

const steam = (identifier: string, url: string): SeedAccount => ({
  slug: "steam",
  identifier,
  url,
  isMain: true,
})

export const MEMBERS: SeedMember[] = [
  {
    pseudo: DEMO_PSEUDO,
    accounts: [
      {
        slug: "league-of-legends",
        identifier: "SOREDAR#EUW",
        url: "https://tracker.gg/lol/profile/riot/SOREDAR%23EUW/overview",
        isMain: true,
      },
      { slug: "league-of-legends", identifier: "Redarito#K2", isMain: false },
      {
        slug: "valorant",
        identifier: "SOREDAR#EUW",
        url: "https://tracker.gg/valorant/profile/riot/SOREDAR%23EUW/overview",
        isMain: true,
      },
      {
        slug: "apex-legends",
        identifier: "Redarito · PC",
        url: "https://apex.tracker.gg/apex/profile/origin/Redarito/overview",
        isMain: true,
      },
      {
        slug: "rocket-league",
        identifier: "Redarcatovichéé",
        url: "https://rocketleague.tracker.network/rocket-league/profile/epic/Redarcatovich%C3%A9%C3%A9/overview",
        isMain: true,
      },
      {
        slug: "aniimo",
        identifier: "RedarDG",
        friendCode: "1254896574",
        isMain: true,
      },
      steam(
        "RedarDG",
        "https://steamcommunity.com/profiles/76561199509396038/",
      ),
    ],
  },
  {
    pseudo: "Alex",
    accounts: [
      steam("styZR36365", "https://steamcommunity.com/id/styZR36365/"),
    ],
  },
  {
    pseudo: "Neroo",
    accounts: [
      steam("Neroo", "https://steamcommunity.com/profiles/76561199203719707/"),
    ],
  },
  {
    pseudo: "JLB",
    accounts: [
      steam("JLB", "https://steamcommunity.com/profiles/76561198280539202/"),
    ],
  },
  {
    pseudo: "Semajike",
    accounts: [
      steam(
        "Semajike",
        "https://steamcommunity.com/profiles/76561199197531909/",
      ),
    ],
  },
]

/** Ajoute les membres absents de la base, avec leurs comptes. Relançable sans doublon. Renvoie les pseudos ajoutés. */
export function seedMembers(db: Database, members = MEMBERS) {
  const users = createUsersRepository(db)
  const accounts = createAccountsRepository(db)
  const now = new Date().toISOString()
  const created: string[] = []

  transaction(db, () => {
    for (const member of members) {
      if (users.findByPseudo(member.pseudo)) continue
      const user = users.create(member.pseudo)
      for (const account of member.accounts) {
        accounts.insert(user.id, {
          url: null,
          friendCode: null,
          rankTier: "",
          rankDivision: null,
          rankLp: null,
          rankDeclared: true,
          ...account,
          id: randomUUID(),
          rankUpdatedAt: now,
        })
      }
      created.push(member.pseudo)
    }
  })
  return created
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { config } = await import("../config")
  const created = seedMembers(openDatabase(config.databasePath))
  console.log(
    created.length
      ? `Membres ajoutés : ${created.join(", ")}`
      : "Tous les membres existent déjà.",
  )
}
