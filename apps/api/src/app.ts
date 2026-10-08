import cookieParser from "cookie-parser"
import cors from "cors"
import express from "express"
import type { Database } from "./db/database"
import { errorHandler, notFoundHandler } from "./middlewares/error-handler"
import { loadUser } from "./middlewares/auth"
import {
  gamesRoutes,
  membersRoutes,
  myAccountsRoutes,
} from "./modules/accounts/accounts.routes"
import { createAccountsRepository } from "./modules/accounts/accounts.repository"
import { createAccountsService } from "./modules/accounts/accounts.service"
import { authRoutes } from "./modules/auth/auth.routes"
import { createAuthService } from "./modules/auth/auth.service"
import { createUsersRepository } from "./modules/users/users.repository"

export type AppOptions = {
  db: Database
  jwtSecret: string
  webOrigin?: string
  secureCookies?: boolean
}

/** Assemble l'application à partir de ses dépendances (injectées pour les tests). */
export function createApp({ db, jwtSecret, webOrigin, secureCookies = false }: AppOptions) {
  const users = createUsersRepository(db)
  const auth = createAuthService(users, jwtSecret)
  const accounts = createAccountsService(db, createAccountsRepository(db), users)

  const app = express()
  if (webOrigin) app.use(cors({ origin: webOrigin, credentials: true }))
  app.use(express.json({ limit: "100kb" }))
  app.use(cookieParser())
  app.use(loadUser(auth))

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true })
  })
  app.use("/api/auth", authRoutes(auth, secureCookies))
  app.use("/api/me/accounts", myAccountsRoutes(accounts))
  app.use("/api/games", gamesRoutes(accounts))
  app.use("/api/members", membersRoutes(accounts))

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
