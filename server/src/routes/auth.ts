import { Hono } from "hono"
import { authMiddleware } from "../middleware/auth"
import { getOrCreateUserWallet } from "../lib/privy"

type AuthEnv = { Variables: { userId: string } }

const app = new Hono<AuthEnv>()

app.use("*", authMiddleware)

// POST /api/auth — called after Privy login, creates server wallet if needed
app.post("/", async (c) => {
  const userId = c.get("userId")
  const { address } = await getOrCreateUserWallet(userId)

  return c.json({ userId, walletAddress: address })
})

export default app
