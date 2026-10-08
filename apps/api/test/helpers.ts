import request from "supertest"
import { createApp } from "../src/app"
import { openDatabase } from "../src/db/database"
import { seedDemo } from "../src/db/seed"

/** Application neuve sur une base en mémoire, avec le membre de démo. */
export async function setupApp() {
  const db = openDatabase(":memory:")
  await seedDemo(db)
  const app = createApp({ db, jwtSecret: "test-secret" })
  return { app, db, agent: request.agent(app) }
}

export const newMember = {
  email: "nox@k2.gg",
  pseudo: "Nox",
  password: "motdepasse",
}
