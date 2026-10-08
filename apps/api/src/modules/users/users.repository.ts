import { randomUUID } from "node:crypto"
import type { Database } from "../../db/database"

export type MemberRow = { id: string; pseudo: string }

export function createUsersRepository(db: Database) {
  return {
    findByPseudo(pseudo: string) {
      return db.prepare("SELECT id, pseudo FROM users WHERE pseudo = ?").get(pseudo) as MemberRow | undefined
    },

    create(pseudo: string): MemberRow {
      const id = randomUUID()
      db.prepare("INSERT INTO users (id, pseudo, created_at) VALUES (?, ?, ?)").run(
        id,
        pseudo,
        new Date().toISOString(),
      )
      return { id, pseudo }
    },
  }
}

export type UsersRepository = ReturnType<typeof createUsersRepository>
