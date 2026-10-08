import { Router } from "express"
import { findGame, saveAccountsSchema } from "@k2/shared"
import { notFound } from "../../lib/http-error"
import { validate } from "../../lib/validate"
import { currentUser, requireAuth } from "../../middlewares/auth"
import type { AccountsService } from "./accounts.service"

/** Comptes du membre connecté : /api/me/accounts */
export function myAccountsRoutes(service: AccountsService) {
  const router = Router()
  router.use(requireAuth)

  router.get("/", (req, res) => {
    res.json({ accounts: service.listMine(currentUser(req).id) })
  })

  router.put("/", (req, res) => {
    const { accounts } = validate(saveAccountsSchema, req.body)
    res.json({ accounts: service.replaceMine(currentUser(req).id, accounts) })
  })

  return router
}

/** Répertoire public : /api/games */
export function gamesRoutes(service: AccountsService) {
  const router = Router()

  router.get("/", (_req, res) => {
    res.json({ games: service.listDirectory() })
  })

  router.get("/:slug/accounts", (req, res) => {
    const { slug } = req.params
    if (!findGame(slug)) throw notFound("Jeu inconnu")
    res.json({ accounts: service.listByGame(slug) })
  })

  return router
}

/** Profils publics : /api/members */
export function membersRoutes(service: AccountsService) {
  const router = Router()

  router.get("/:pseudo", (req, res) => {
    res.json({ member: service.getMember(req.params.pseudo) })
  })

  return router
}
