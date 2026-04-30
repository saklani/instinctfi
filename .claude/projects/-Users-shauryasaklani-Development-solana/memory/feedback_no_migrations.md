---
name: Never run DB migrations
description: Never run drizzle-kit push or any database migration commands unless explicitly asked
type: feedback
---

Never run `bunx drizzle-kit push`, `drizzle-kit migrate`, or any database migration/schema push commands unless the user explicitly asks. The user manages migrations themselves.

**Why:** User wants full control over when schema changes hit the database.
**How to apply:** Only modify schema files. Never execute migration commands.
