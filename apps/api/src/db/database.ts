import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { DatabaseSync } from "node:sqlite"

export type Database = DatabaseSync

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    pseudo TEXT NOT NULL UNIQUE COLLATE NOCASE,
    phone TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    identifier TEXT NOT NULL,
    url TEXT,
    friend_code TEXT,
    is_main INTEGER NOT NULL,
    rank_tier TEXT NOT NULL,
    rank_division TEXT,
    rank_lp INTEGER,
    rank_updated_at TEXT NOT NULL,
    rank_declared INTEGER NOT NULL DEFAULT 1
  );

  CREATE INDEX IF NOT EXISTS game_accounts_slug ON game_accounts(slug);
  CREATE INDEX IF NOT EXISTS game_accounts_user ON game_accounts(user_id);
`

/** Ouvre la base (":memory:" pour les tests) et applique le schéma. */
export function openDatabase(path: string): Database {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec("PRAGMA foreign_keys = ON")
  db.exec(schema)
  return db
}

/** Exécute `work` dans une transaction, annulée en cas d'erreur. */
export function transaction<T>(db: Database, work: () => T): T {
  db.exec("BEGIN")
  try {
    const result = work()
    db.exec("COMMIT")
    return result
  } catch (error) {
    db.exec("ROLLBACK")
    throw error
  }
}
