import { createMiddleware } from "hono/factory"
import { privy } from "../lib/privy.js"
import type { AuthEnv } from "../lib/types.js"

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "")

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  try {
    const verified = await privy.utils().auth().verifyAccessToken(token)
    c.set("userId", verified.user_id)
    await next()
  } catch {
    return c.json({ error: "Invalid token" }, 401)
  }
})
