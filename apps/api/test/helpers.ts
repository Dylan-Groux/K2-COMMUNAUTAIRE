import { createApp } from "../src/app"
import { openDatabase } from "../src/db/database"
import { seedDemo } from "../src/db/seed"

/** Application neuve sur une base en mémoire, avec le membre de démo. */
export function setupApp() {
  const db = openDatabase(":memory:")
  seedDemo(db)
  return { app: createApp({ db }), db }
}
