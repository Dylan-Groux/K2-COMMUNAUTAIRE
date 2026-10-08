import { createApp } from "./app"
import { config } from "./config"
import { openDatabase } from "./db/database"

const db = openDatabase(config.databasePath)
const app = createApp({
  db,
  jwtSecret: config.jwtSecret,
  webOrigin: config.webOrigin,
  secureCookies: config.isProduction,
})

app.listen(config.port, () => {
  console.log(`API K2 prête sur http://localhost:${config.port}`)
})
