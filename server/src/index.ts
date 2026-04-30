import { Hono } from "hono"
import { cors } from "hono/cors"
import { serve } from "inngest/hono"
import { inngest } from "./inngest/client"
import { processOrder } from "./inngest/functions"
import ordersRoute from "./routes/orders"
import positionsRoute from "./routes/positions"
import vaultsRoute from "./routes/vaults"
import stocksRoute from "./routes/stocks"

const app = new Hono()

app.use("*", cors())

app.get("/", (c) => c.json({ name: "Instinct API", status: "ok" }))

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
