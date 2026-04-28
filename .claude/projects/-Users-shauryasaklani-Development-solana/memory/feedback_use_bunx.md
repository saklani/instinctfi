---
name: Use bunx not npx
description: User prefers bunx over npx for running package binaries in this project
type: feedback
---

Use `bunx` instead of `npx` for running package binaries (e.g., `bunx tsc --noEmit`, `bunx shadcn@latest add`). The project uses Bun as the package manager.

**Why:** User preference, project uses Bun throughout.
**How to apply:** Any time you'd reach for `npx`, use `bunx` instead. Same for `npm install` → `bun add`, `npm run` → `bun run`.
