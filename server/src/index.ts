import { Hono } from "hono"
import { cors } from "hono/cors"
import { serve } from "inngest/hono"
import { inngest } from "./inngest/client.js"
import { processOrder } from "./inngest/functions.js"
import authRoute from "./routes/auth.js"
import ordersRoute from "./routes/orders.js"
import positionsRoute from "./routes/positions.js"
import vaultsRoute from "./routes/vaults.js"
import stocksRoute from "./routes/stocks.js"

const app = new Hono()

app.use("*", cors())

app.get("/", (c) => c.json({ name: "Instinct API", status: "ok" }))

app.route("/api/auth", authRoute)
app.route("/api/orders", ordersRoute)
app.route("/api/positions", positionsRoute)
app.route("/api/vaults", vaultsRoute)
app.route("/api/stocks", stocksRoute)

app.on(
  ["GET", "PUT", "POST"],
  "/api/inngest",
  serve({ client: inngest, functions: [processOrder] }),
)

export default app
