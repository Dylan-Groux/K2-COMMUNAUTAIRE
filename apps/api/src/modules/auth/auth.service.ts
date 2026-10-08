import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import type { LoginInput, RegisterInput, User } from "@k2/shared"
import { conflict, unauthorized } from "../../lib/http-error"
import type { UsersRepository } from "../users/users.repository"

const TOKEN_TTL = "7d"

const publicUser = ({ id, email, pseudo }: User): User => ({ id, email, pseudo })

export function createAuthService(users: UsersRepository, jwtSecret: string) {
  return {
    async register(input: RegisterInput) {
      if (users.findByEmail(input.email)) throw conflict("Cet email est déjà utilisé")
      if (users.findByPseudo(input.pseudo)) throw conflict("Ce pseudo est déjà pris")
      const passwordHash = await bcrypt.hash(input.password, 10)
      return publicUser(users.create({ ...input, passwordHash }))
    },

    async login(input: LoginInput) {
      const user = users.findByEmail(input.email)
      const valid = user && (await bcrypt.compare(input.password, user.passwordHash))
      if (!user || !valid) throw unauthorized("Email ou mot de passe incorrect")
      return publicUser(user)
    },

    signToken(user: User) {
      return jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: TOKEN_TTL })
    },

    /** Renvoie l'utilisateur du jeton, ou undefined si le jeton est invalide. */
    verifyToken(token: string) {
      try {
        const { sub } = jwt.verify(token, jwtSecret) as { sub: string }
        const user = users.findById(sub)
        return user && publicUser(user)
      } catch {
        return undefined
      }
    },
  }
}

export type AuthService = ReturnType<typeof createAuthService>
