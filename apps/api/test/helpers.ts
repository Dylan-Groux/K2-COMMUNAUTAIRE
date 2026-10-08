import { createApp } from "../src/app"
import { openDatabase } from "../src/db/database"
import { seedMembers } from "../src/db/seed"

/** Application neuve sur une base en mémoire, avec les membres du seed. */
export function setupApp() {
  const db = openDatabase(":memory:")
  seedMembers(db)
  return { app: createApp({ db }), db }
}
