import { defineConfig } from "drizzle-kit"

import { neonConfig } from "@neondatabase/serverless"


neonConfig.poolQueryViaFetch = true

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
