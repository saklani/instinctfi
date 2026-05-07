# Server Rules

- Always prefer `bun` and `bunx` instead of `npm` and `npx`.
- Never run database migrations unless explicitly asked to do so. Do not run `bunx drizzle-kit migrate` or `bunx drizzle-kit push`.
- `bunx drizzle-kit generate` is allowed.
