import { Hono } from "hono"
import { cors } from "hono/cors"
import authRoute from "./routes/auth.js"
import vaultsRoute from "./routes/vaults.js"
import stocksRoute from "./routes/stocks.js"

const app = new Hono()

app.use("*", cors())

app.get("/", (c) => c.json({ name: "Instinct API", status: "ok" }))

app.route("/api/auth", authRoute)
app.route("/api/vaults", vaultsRoute)
app.route("/api/stocks", stocksRoute)

export default app
