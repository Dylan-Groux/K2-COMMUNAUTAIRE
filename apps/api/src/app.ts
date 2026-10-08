import cors from "cors"
import express from "express"
import type { Database } from "./db/database"
import { errorHandler, notFoundHandler } from "./middlewares/error-handler"
import { gamesRoutes, membersRoutes } from "./modules/accounts/accounts.routes"
import { createAccountsRepository } from "./modules/accounts/accounts.repository"
import { createAccountsService } from "./modules/accounts/accounts.service"
import { createUsersRepository } from "./modules/users/users.repository"

export type AppOptions = {
  db: Database
  webOrigin?: string
}

/** Assemble l'application à partir de ses dépendances (injectées pour les tests). API publique, en lecture seule. */
export function createApp({ db, webOrigin }: AppOptions) {
  const accounts = createAccountsService(createAccountsRepository(db), createUsersRepository(db))

  const app = express()
  if (webOrigin) app.use(cors({ origin: webOrigin }))

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true })
  })
  app.use("/api/games", gamesRoutes(accounts))
  app.use("/api/members", membersRoutes(accounts))

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
