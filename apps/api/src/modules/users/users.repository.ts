import { randomUUID } from "node:crypto"
import type { User } from "@k2/shared"
import type { Database } from "../../db/database"

type UserRow = {
  id: string
  email: string
  pseudo: string
  password_hash: string
}

export type UserWithPassword = User & { passwordHash: string }

const toUser = (row: UserRow): UserWithPassword => ({
  id: row.id,
  email: row.email,
  pseudo: row.pseudo,
  passwordHash: row.password_hash,
})

export function createUsersRepository(db: Database) {
  return {
    findById(id: string) {
      const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined
      return row && toUser(row)
    },

    findByEmail(email: string) {
      const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
        | UserRow
        | undefined
      return row && toUser(row)
    },

    findByPseudo(pseudo: string) {
      const row = db.prepare("SELECT * FROM users WHERE pseudo = ?").get(pseudo) as
        | UserRow
        | undefined
      return row && toUser(row)
    },

    create(input: { email: string; pseudo: string; phone?: string; passwordHash: string }) {
      const id = randomUUID()
      db.prepare(
        `INSERT INTO users (id, email, pseudo, phone, password_hash, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      ).run(id, input.email, input.pseudo, input.phone ?? null, input.passwordHash, new Date().toISOString())
      return this.findById(id)!
    },
  }
}

export type UsersRepository = ReturnType<typeof createUsersRepository>
