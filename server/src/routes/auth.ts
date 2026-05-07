import { Hono } from "hono"
import { authMiddleware } from "../middleware/auth.js"

type AuthEnv = { Variables: { userId: string } }

const app = new Hono<AuthEnv>()

app.use("*", authMiddleware)

// POST /api/auth — verifies the caller is signed in.
app.post("/", async (c) => {
  return c.json({ userId: c.get("userId") })
})

export default app
