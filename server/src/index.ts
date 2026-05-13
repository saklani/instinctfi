import { Hono } from "hono"
import { cors } from "hono/cors"
import { serve } from "inngest/hono"

import { inngest } from "./inngest/client.js"
import { snapshotLeaderboard, snapshotStockPrices } from "./inngest/functions.js"
import authRoute from "./routes/auth.js"
import leaderboardRoute from "./routes/leaderboard.js"
import vaultsRoute from "./routes/vaults.js"
import stocksRoute from "./routes/stocks.js"

const app = new Hono()

app.use("*", cors())

app.get("/", (c) => c.json({ name: "Instinct API", status: "ok" }))

app.route("/api/auth", authRoute)
app.route("/api/vaults", vaultsRoute)
app.route("/api/stocks", stocksRoute)
app.route("/api/leaderboard", leaderboardRoute)

app.on(
  ["GET", "PUT", "POST"],
  "/api/inngest",
  serve({ client: inngest, functions: [snapshotLeaderboard, snapshotStockPrices] }),
)

export default app
