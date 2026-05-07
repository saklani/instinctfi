# Server Rules

- Always prefer `bun` and `bunx` instead of `npm` and `npx`.
- Never run database migrations unless explicitly asked to do so. Do not run `bunx drizzle-kit migrate` or `bunx drizzle-kit push`.
- `bunx drizzle-kit generate` is allowed.
- Export types once from the database schema into `lib/types.ts` and import from there. Do not redefine row/insert types in routes, scripts, or feature modules.
