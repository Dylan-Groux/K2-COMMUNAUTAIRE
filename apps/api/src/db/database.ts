import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { DatabaseSync } from "node:sqlite"

export type Database = DatabaseSync

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    pseudo TEXT NOT NULL UNIQUE COLLATE NOCASE,
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

/**
 * Bases créées quand le site avait des comptes : la table users contenait e-mail, téléphone et mot de passe.
 * On reconstruit la table avec seulement l'identifiant et le pseudo ; les comptes de jeu sont conservés.
 */
function dropLoginColumns(db: Database) {
  const columns = (
    db.prepare("PRAGMA table_info(users)").all() as { name: string }[]
  ).map((c) => c.name)
  if (!columns.includes("password_hash")) return
  db.exec(`
    PRAGMA foreign_keys = OFF;
    BEGIN;
    CREATE TABLE users_new (
      id TEXT PRIMARY KEY,
      pseudo TEXT NOT NULL UNIQUE COLLATE NOCASE,
      created_at TEXT NOT NULL
    );
    INSERT INTO users_new (id, pseudo, created_at) SELECT id, pseudo, created_at FROM users;
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
    COMMIT;
  `)
}

/** Ouvre la base (":memory:" pour les tests) et applique le schéma. */
export function openDatabase(path: string): Database {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  dropLoginColumns(db)
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
