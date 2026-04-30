import { createMiddleware } from "hono/factory"
import { privy } from "../lib/privy.js"

type AuthEnv = {
  Variables: {
    userId: string
  }
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "")

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401)
  }

  try {
    const verified = await privy.utils().auth().verifyAccessToken({
      access_token: token,
    })
    c.set("userId", verified.userId)
    await next()
  } catch {
    return c.json({ error: "Invalid token" }, 401)
  }
})
