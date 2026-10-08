import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { DatabaseSync } from "node:sqlite"
import { describe, expect, it } from "vitest"
import { openDatabase } from "../src/db/database"

describe("migration de la base", () => {
  it("retire e-mail et mot de passe d'une ancienne base, sans perdre les membres ni leurs comptes", () => {
    const path = join(mkdtempSync(join(tmpdir(), "qls-api-")), "old.db")
    const old = new DatabaseSync(path)
    old.exec(`
      CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, pseudo TEXT NOT NULL UNIQUE,
        phone TEXT, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE game_accounts (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        slug TEXT NOT NULL, identifier TEXT NOT NULL, url TEXT, friend_code TEXT, is_main INTEGER NOT NULL,
        rank_tier TEXT NOT NULL, rank_division TEXT, rank_lp INTEGER, rank_updated_at TEXT NOT NULL,
        rank_declared INTEGER NOT NULL DEFAULT 1);
      INSERT INTO users VALUES ('u1', 'nox@qls.gg', 'Nox', NULL, 'hash', '2026-10-01');
      INSERT INTO game_accounts (id, user_id, slug, identifier, is_main, rank_tier, rank_updated_at)
        VALUES ('a1', 'u1', 'valorant', 'Nox#EUW', 1, 'Or', '2026-10-01');
    `)
    old.close()

    const db = openDatabase(path)
    const columns = (
      db.prepare("PRAGMA table_info(users)").all() as { name: string }[]
    ).map((c) => c.name)
    expect(columns).toEqual(["id", "pseudo", "created_at"])
    expect(db.prepare("SELECT pseudo FROM users").all()).toEqual([
      { pseudo: "Nox" },
    ])
    expect(db.prepare("SELECT COUNT(*) AS n FROM game_accounts").get()).toEqual(
      { n: 1 },
    )
    db.close()
  })
})
