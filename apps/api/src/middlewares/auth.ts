import type { NextFunction, Request, Response } from "express"
import type { User } from "@k2/shared"
import { unauthorized } from "../lib/http-error"
import type { AuthService } from "../modules/auth/auth.service"

export const SESSION_COOKIE = "k2_session"

declare global {
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

/** Attache `req.user` si un cookie de session valide est présent. */
export const loadUser =
  (auth: AuthService) => (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.[SESSION_COOKIE]
    if (token) req.user = auth.verifyToken(token)
    next()
  }

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw unauthorized()
  next()
}

/** Raccourci typé pour les handlers placés derrière `requireAuth`. */
export const currentUser = (req: Request) => {
  if (!req.user) throw unauthorized()
  return req.user
}
