import { Router, type Response } from "express"
import { loginSchema, registerSchema, type User } from "@k2/shared"
import { validate } from "../../lib/validate"
import { currentUser, requireAuth, SESSION_COOKIE } from "../../middlewares/auth"
import type { AuthService } from "./auth.service"

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000

export function authRoutes(auth: AuthService, secureCookies: boolean) {
  const router = Router()

  const openSession = (res: Response, user: User) =>
    res.cookie(SESSION_COOKIE, auth.signToken(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookies,
      maxAge: SEVEN_DAYS,
    })

  router.post("/register", async (req, res) => {
    const user = await auth.register(validate(registerSchema, req.body))
    openSession(res, user).status(201).json({ user })
  })

  router.post("/login", async (req, res) => {
    const user = await auth.login(validate(loginSchema, req.body))
    openSession(res, user).json({ user })
  })

  router.post("/logout", (_req, res) => {
    res.clearCookie(SESSION_COOKIE).status(204).end()
  })

  router.get("/me", requireAuth, (req, res) => {
    res.json({ user: currentUser(req) })
  })

  return router
}
