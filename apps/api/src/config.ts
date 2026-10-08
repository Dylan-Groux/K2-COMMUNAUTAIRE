import { existsSync } from "node:fs"

if (existsSync(".env")) process.loadEnvFile(".env")

export const config = {
  port: Number(process.env.PORT ?? 3001),
  databasePath: process.env.DATABASE_PATH ?? "./data/k2.db",
  webOrigin: process.env.WEB_ORIGIN || undefined,
}

export type AppConfig = typeof config
