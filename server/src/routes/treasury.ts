import { Hono } from "hono"
import { getTreasuryWallet } from "../lib/privy.js"

const app = new Hono()

app.get("/", (c) => {
  const treasury = getTreasuryWallet()
  return c.json({ address: treasury.address })
})

export default app
