import { createApp } from "./app"
import { config } from "./config"
import { openDatabase } from "./db/database"

const db = openDatabase(config.databasePath)
const app = createApp({ db, webOrigin: config.webOrigin })

app.listen(config.port, () => {
  console.log(`API QLS prête sur http://localhost:${config.port}`)
})
