import { randomUUID } from "node:crypto"
import { pathToFileURL } from "node:url"
import {
  createAccountsRepository,
  type NewAccountRow,
} from "../modules/accounts/accounts.repository"
import { createUsersRepository } from "../modules/users/users.repository"
import { openDatabase, transaction, type Database } from "./database"

export const DEMO_PSEUDO = "RedarDG"

type DemoAccount = Omit<
  NewAccountRow,
  "id" | "rankUpdatedAt" | "url" | "friendCode" | "rankDivision" | "rankLp"
> &
  Partial<Pick<NewAccountRow, "url" | "friendCode" | "rankDivision" | "rankLp">>

const demoAccounts: DemoAccount[] = [
  {
    slug: "league-of-legends",
    identifier: "SOREDAR#EUW",
    url: "https://tracker.gg/lol/profile/riot/SOREDAR%23EUW/overview",
    isMain: true,
    rankTier: "Diamond",
    rankDivision: "II",
    rankLp: 64,
    rankDeclared: false,
  },
  {
    slug: "league-of-legends",
    identifier: "Redarito#K2",
    isMain: false,
    rankTier: "Emerald",
    rankDivision: "I",
    rankLp: 28,
    rankDeclared: false,
  },
  {
    slug: "valorant",
    identifier: "SOREDAR#EUW",
    url: "https://tracker.gg/valorant/profile/riot/SOREDAR%23EUW/overview",
    isMain: true,
    rankTier: "Ascendant",
    rankDivision: "2",
    rankLp: 71,
    rankDeclared: false,
  },
  {
    slug: "apex-legends",
    identifier: "Redarito · PC",
    url: "https://apex.tracker.gg/apex/profile/origin/Redarito/overview",
    isMain: true,
    rankTier: "Platinum",
    rankDivision: "I",
    rankLp: 824,
    rankDeclared: false,
  },
  {
    slug: "rocket-league",
    identifier: "Redarcatovichéé",
    url: "https://rocketleague.tracker.network/rocket-league/profile/epic/Redarcatovich%C3%A9%C3%A9/overview",
    isMain: true,
    rankTier: "Champion",
    rankDivision: "II",
    rankDeclared: true,
  },
  {
    slug: "aniimo",
    identifier: "RedarDG",
    friendCode: "1254896574",
    isMain: true,
    rankTier: "Or",
    rankDivision: "III",
    rankDeclared: true,
  },
  {
    slug: "steam",
    identifier: "RedarDG",
    url: "https://steamcommunity.com/profiles/76561199509396038/",
    isMain: true,
    rankTier: "Niveau 42",
    rankDeclared: true,
  },
]

/** Crée le membre de démo et ses comptes s'il n'existe pas encore. */
export function seedDemo(db: Database) {
  const users = createUsersRepository(db)
  if (users.findByPseudo(DEMO_PSEUDO)) return false

  const accounts = createAccountsRepository(db)
  const now = new Date().toISOString()

  transaction(db, () => {
    const user = users.create(DEMO_PSEUDO)
    for (const account of demoAccounts) {
      accounts.insert(user.id, {
        url: null,
        friendCode: null,
        rankDivision: null,
        rankLp: null,
        ...account,
        id: randomUUID(),
        rankUpdatedAt: now,
      })
    }
  })
  return true
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { config } = await import("../config")
  const created = seedDemo(openDatabase(config.databasePath))
  console.log(
    created
      ? `Membre de démo créé : ${DEMO_PSEUDO}`
      : "Le membre de démo existe déjà.",
  )
}
