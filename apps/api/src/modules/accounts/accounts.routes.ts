import { Router } from "express"
import { findGame } from "@k2/shared"
import { notFound } from "../../lib/http-error"
import type { AccountsService } from "./accounts.service"

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
