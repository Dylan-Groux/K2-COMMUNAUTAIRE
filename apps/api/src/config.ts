import { existsSync } from "node:fs"

if (existsSync(".env")) process.loadEnvFile(".env")

const isProduction = process.env.NODE_ENV === "production"
const jwtSecret = process.env.JWT_SECRET ?? (isProduction ? undefined : "k2-dev-secret")
if (!jwtSecret) throw new Error("JWT_SECRET est obligatoire en production")

export const config = {
  port: Number(process.env.PORT ?? 3001),
  databasePath: process.env.DATABASE_PATH ?? "./data/k2.db",
  jwtSecret,
  webOrigin: process.env.WEB_ORIGIN || undefined,
  isProduction,
}

export type AppConfig = typeof config
