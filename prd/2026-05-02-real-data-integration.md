# PRD: Real-data integration for vaults & compositions

> Phase 8 of `plans/visual-redesign.md`. Replaces deterministic mocks with live on-chain + aggregator data.
>
> Suggested PRD path on plan-exit: `prd/2026-05-02-real-data-integration.md` (mirrors existing `prd/2026-05-01-visual-redesign.md` convention).

## Problem Statement

The redesigned PWA looks production-grade but every number on it is mocked: NAV chart drawn from a `seedFromString(vault.id)` sinusoid, 24h deltas from `(seed % 41) - 20`, TVL/holders/volume hardcoded. A judge or first user opens `/fund/$id`, sees a beautiful Pelosi-Tracker NAV chart, then realizes nothing reflects reality. For a hackathon submission targeting a $3K Jupiter bounty and a real-money product narrative, the basket NAV must move with the underlying xStocks; the composition list must show live 24h moves; TVL must reflect actual deposits.

## Solution

Replace the mock layer with a thin server-side data proxy on the existing Hono backend that:

1. Pulls live prices for the 8 underlying xStock SPL mints (NVDAx, GOOGLx, AMZNx, AAPLx, METAx, PLTRx, MSFTx, TSLAx) from **Jupiter Price API V3** — keyless, one POST returns `usdPrice + priceChange24h` for all mints.
2. Pulls historical OHLCV per mint from **Birdeye OHLCV V3** and computes a weighted-sum synthetic NAV chart per (vault, period).
3. Reads vault SPL supply via the existing **Helius RPC** (`getTokenSupply`) and multiplies by NAV → TVL.
4. Caches everything in-memory with sane TTLs (prices 30s, OHLCV 10min, TVL 60s) so we don't burn Birdeye free-tier quota.
5. Exposes new endpoints under the existing `/api` namespace; PWA TanStack Query layer adds two hooks (`useVaultNav`, `useVaultStats`) — no new client deps.

The user-visible result: NAV chart actually moves with NVDAx/GOOGLx/etc. price action; composition list shows real per-stock 24h deltas; the stats grid trims to a tight 2×2 (TVL + Period Return + Performance Fee + Management Fee). Discover hero ranks featured cards from real numbers (Top Performer = highest 24h NAV delta across vaults). News and 24h volume / holders / inception are explicitly deferred.

## User Stories

1. As a basket investor on Discover, I want featured cards (Trending / Top Performer 24H / Newest) ranked by **real** TVL and 24h NAV delta, so the cards reflect which vaults actually moved today.
2. As a basket investor scanning the vault table on `/`, I want each row's NAV, 24h%, and 7d% computed from live underlying prices, so I can compare baskets at a glance without distrusting the numbers.
3. As a Pelosi-Tracker enthusiast on `/fund/$id`, I want the NAV price block to show current basket value derived from a weighted sum of the 8 xStock prices, so the headline number on the page is the real one.
4. As a chartist on `/fund/$id`, I want the NAV chart for 1W / 1M / 3M / 1Y / ALL to be the weighted sum of underlying xStock OHLC over that window, so the line tells me what the basket actually did.
5. As that same chartist, I want the chart to re-stroke smoothly when I switch periods, with the existing path-draw animation, so the live-data swap doesn't regress Phase 3 polish.
6. As a basket investor on `/fund/$id`, I want the composition list to show each xStock's real 24h delta next to its weight, so I can see which constituents drove today's move.
7. As a basket investor, I want the stats grid to show TVL (live) + Period Return (% over the chart's selected period) + Performance Fee + Management Fee, in a tight 2×2, so the page communicates value clearly without padding stats I can't trust yet.
8. As a basket investor, I want the NAV value to count up/down with `Ticker` animation when prices refresh, so the page feels alive.
9. As an oncall dev, I want stale-data graceful handling — if Jupiter or Birdeye is down, the UI shows the last good cache value with a subtle staleness hint, not a blank state.
10. As an oncall dev, I want Phase 8 to obey the existing `prefers-reduced-motion` and `IntersectionObserver` rules from Phase 3, so a real-data refresh doesn't re-fire animations off-screen or against user preference.
11. As a hackathon submitter targeting the Jupiter bounty, I want every current-price read on the platform to flow through Jupiter Price API V3, so the submission has a clear, demonstrable Jupiter integration.
12. As a developer reading the codebase, I want all numerics on `/fund/$id` to keep flowing through `<MonoNumber>`, so format consistency is preserved during the data swap.
13. As a developer extending the system, I want the data layer to be additive — new server endpoints + new client hooks — leaving `useVault`, `useVaults`, `usePositions`, `usePendingOrders` and Phase 3 components unchanged at their import boundaries.
14. As a developer, I want the server cache TTLs configurable per data type so I can tune for demo (snappy) vs prod (rate-limit-safe) without code changes.
15. As a Privy-authenticated user, I don't want any change to my session or wallet flow as a result of Phase 8 — auth stays Phase 2.
16. As a basket investor on `/fund/$id`, I want a clear "as of {timestamp}" hint near the NAV value when prices have been polled, so I know how fresh the number is.
17. As a developer, I want every Birdeye call gated behind the server (key not in browser) so we don't leak the Birdeye API key when the PWA ships.
18. As a basket investor on mobile, I want all data swaps to keep the sticky CTA / bottom-tab inset behavior from Phase 3 intact, so layout doesn't reflow when prices land.
19. As a future basket investor, when News (Phase 9) lands, I want it to slot into the same Phase-3 surface without further restructure of the detail page.
20. As a developer, I want a single mints→Jupiter-prices fetch reused across the discover page (8 row computations), the detail page, and the portfolio page, so we don't N+1 on price requests.

## Implementation Decisions

### Modules touched

- **Server (existing Hono app)** — add `services/prices.ts` (Jupiter Price API V3 client + cache), `services/ohlcv.ts` (Birdeye OHLCV V3 client + cache), `services/nav.ts` (weighted-sum NAV math + period reductions), `services/vault-stats.ts` (TVL via RPC + period return derivation), and three new route handlers under existing `/api` namespace.
- **PWA data layer** — add `features/vaults/hooks/use-vault-nav.ts` and `features/vaults/hooks/use-vault-stats.ts` (TanStack Query). Existing `useVault`, `useVaults`, `usePositions`, `usePendingOrders` hooks unchanged.
- **PWA Discover** (`routes/index.tsx`) — replace `buildSparkValues` and `buildRowData` mock generators with derivations from live data. Featured-card sparkline driven by 1W series from new NAV endpoint. Vault table NAV/24h/7d/TVL/Holders/Inception columns: NAV+24h+7d+TVL go live; Holders + Inception are dropped from the row in this phase (matches stats-grid trim).
- **PWA Vault Detail** (`routes/fund.$id.tsx`) — delete `generateMockNavData`, `deriveVaultStats`, mock per-holding `delta24h`, `mockNewsFor`. NavChart fed from `useVaultNav(id, period)`. Stats grid trimmed to 2×2 (TVL + Period Return + Performance Fee + Management Fee). Composition list per-stock 24h delta sourced from live prices. News section hidden behind a Phase-9 stub (component preserved, returns null).
- **PWA Portfolio** (`routes/portfolio.tsx`, Phase 5) — when it lands or in parallel, holdings and 24h delta share the same `/api/prices` call.

### New API endpoints (server-side)

- `GET /api/prices?mints=<csv>` → `{ [mint]: { usdPrice: number, priceChange24h: number, blockId: number } }`
  - Backed by Jupiter Price API V3. Cache 30s, in-memory keyed by sorted CSV.
  - Used by Discover (single call for all vault compositions) and `/fund/$id` (composition list).

- `GET /api/vaults/:id/nav?period=1W|1M|3M|1Y|ALL` → `{ series: [{ ts: number, value: number }], periodReturn: number, currentNav: number, delta24h: number }`
  - Server: load vault compositions from DB → request Birdeye OHLCV per composition mint at the period's resolution → align timestamps → weighted sum (`Σ wᵢ × pᵢ(t)` where `wᵢ = weightBps / 10_000`) → normalize to NAV per "share" (basket-unit). `periodReturn = (last - first) / first`. `delta24h` from same series' last-vs-24h-ago point. Cache 10min keyed by `(vaultId, period)`.

- `GET /api/vaults/:id/stats` → `{ tvl: number, performanceFeeBps: number, managementFeeBps: number, vaultMintSupply: number, navPerShare: number }`
  - Server: `getTokenSupply(vaultMint)` via Helius RPC, multiply by current NAV-per-share from the price service. Fees pulled from existing DB row. Cache 60s.

### Resolution / candle config

- Birdeye OHLCV `type` parameter chosen per period: `1W → 1H`, `1M → 4H`, `3M → 1D`, `1Y → 1D`, `ALL → 1W`. Bounded to ≤200 points per series so chart enter animation stays smooth.
- All 8 composition mints requested for a single period → align timestamps → weighted sum. Mints requested in parallel (`Promise.all`).

### Stats grid trim

| Old (mock) | New (live) |
|---|---|
| TVL | TVL — vaultMintSupply × NAV |
| 24h Volume | Period Return — % over selected chart period (reuses chart math) |
| Holders | Performance Fee — from DB |
| Performance Fee | Management Fee — from DB |
| Management Fee | — (slot removed) |
| Inception | — (slot removed) |

→ 2×2 grid. Holders / 24h Volume / Inception are deferred (out of scope below).

### Featured-card ranking on Discover

- **Top Performer 24H** = vault with highest `delta24h` from `/api/vaults/:id/nav` (a small parallel fetch keyed by 1W to cheaply derive 24h delta). For one-vault state, slot stays populated with that vault.
- **Trending** = vault with highest TVL.
- **Newest** = first vault in DB order until on-chain inception lands.

### Cache strategy

- In-memory `Map<key, { value, expiresAt }>` per service. No Redis for the hack — single-server Hono.
- TTLs: prices 30s, NAV series 10min, vault stats 60s. Configurable via env `PRICE_TTL_MS`, `OHLCV_TTL_MS`, `STATS_TTL_MS`.
- On cache miss + upstream error → return last-known value with a `stale: true` flag in the JSON. Client surfaces an "as of {timestamp}" pill near the NAV value when `stale === true`.

### Client integration

- `useVaultNav(id, period)` — TanStack Query, `staleTime: 30s` (prices) / `staleTime: 5min` (history), keyed by `["vault-nav", id, period]`.
- `useVaultStats(id)` — TanStack Query, `staleTime: 60s`, keyed by `["vault-stats", id]`.
- `usePrices(mints)` — TanStack Query, `staleTime: 30s`, keyed by `["prices", sorted-csv]`. Used by composition list and discover row computations.

### Bounty integration

- **Jupiter ($3K)** — Price API V3 calls flow through one server module. Submission notes call out Jupiter as the source-of-truth for current SPL prices powering NAV computation across all surfaces. Future Phase: deposit/withdraw flow gets Jupiter Quote API for swap execution.
- **Dune Sim** — explicitly skipped this phase.

### Animation + a11y preservation

- NAV chart enter animation, IntersectionObserver gating, time-period `LayoutPill` switch re-stroke (700ms) — all preserved. The data swap is invisible to motion code; `chartData` shape (`{ date, value }[]`) is unchanged.
- `<Ticker>` continues to wrap NAV value; `useReducedMotion()` continues to gate.
- All numerics keep flowing through `<MonoNumber>`.

### Failure modes

- Jupiter down → cache returns stale; UI shows "as of {ts}" hint.
- Birdeye down → 503 from `/api/vaults/:id/nav`; client renders chart shell with skeleton + retry button (Phase 7-style skeleton already exists).
- Birdeye missing data for one composition → server logs warning + drops that constituent from the weighted sum for that timestamp (degrades gracefully; weights renormalized over present constituents).

## Out of Scope

- News cards on `/fund/$id` — Phase 9.
- Holders count, 24h volume, Inception in stats grid — deferred.
- Per-user portfolio aggregation via Dune Sim (`/portfolio` real-data) — Phase 5 / 9.
- Pyth integration — evaluated but rejected for this phase (only 5/8 xStocks covered).
- Jupiter Quote API integration in deposit flow — separate work item, not in Phase 8.
- WebSocket price streaming — polling at 30s is adequate for the demo.
- Redis or persistent cache — in-memory only.
- A second vault — current seed has only `Pelosi Tracker`. New vaults are seeded via existing `scripts/seed.ts` flow, no Phase-8 code change required.
- Performance / management fee derivation from on-chain Anchor program state — keep DB values for now.
- Multi-currency display (everything stays USD).

## Further Notes

- Jupiter Price API V3 endpoint: `https://lite-api.jup.ag/price/v3` (POST or GET with `ids=<mints csv>`). Returns object keyed by mint with `usdPrice`, `priceChange24h`, `decimals`, `blockId`. Keyless.
- Birdeye OHLCV V3 endpoint: `GET /defi/v3/ohlcv` with `address`, `type` (resolution), `time_from`, `time_to`. Header `X-API-KEY` required. Returns up to 5000 candles per call. Add `BIRDEYE_API_KEY` to server `.env` (free tier suffices for hack traffic).
- Verified Pyth xStocks coverage (informational, in case we revisit): AAPLX, NVDAX, GOOGLX, METAX, TSLAX confirmed via Hermes; AMZNx/PLTRx/MSFTx not in Pyth's xStocks set as of this writing.
- Existing seeded vault: `Pelosi Tracker` (vaultMint `FXcxe5f3AwkJZRaoYFuGME7rEXS4NmBxZPYKVh3Q4bnD`, 8 compositions weighted NVDAx 22% / GOOGLx 17% / AMZNx 13% / AAPLx 10% / METAx 10% / PLTRx 10% / MSFTx 10% / TSLAx 8%).
- Scripts CLAUDE.md mandates Bun for any seed/script work — preserve that.
- Implementation plan (`plans/2026-05-02-real-data-integration.md`) to follow this PRD using the standard tracer-bullet phasing convention.

## Verification

End-to-end manual test on `/fund/<pelosi-tracker-id>`:
1. `pnpm dev` (PWA) + `bun run server` clean start.
2. Open `/` — vault row shows non-zero NAV close to underlying basket value (sanity-check: 22% × NVDAx + 17% × GOOGLx + …); 24h column reflects market state.
3. Click into Pelosi Tracker → NAV chart populates within ~1s; chart strokes draw once; switching `1W → 1M → 3M → 1Y → ALL` triggers re-stroke without N+1 network calls (network tab confirms one `/api/vaults/:id/nav?period=...` per switch, served from cache on repeat).
4. Composition list — every row shows a 24h delta colored by sign; values match Jupiter's `priceChange24h` for that mint within rounding.
5. Stats grid — 2×2 with TVL (real or 0 if no deposits), Period Return matching chart endpoints, Perf Fee, Mgmt Fee.
6. Reload — staleness pill absent on warm cache; pull network plug → after 30s stale window, "as of {ts}" pill appears.
7. `prefers-reduced-motion: reduce` toggled in DevTools → chart still re-strokes via opacity-only on period switch; `Ticker` instant-updates.
8. Mobile 375px — sticky CTA insets unchanged; chart fits viewport; deltas readable.

Automated checks: `pnpm typecheck`, `pnpm build`, `bun test` (server) clean.

Bounty submission readiness: server `services/prices.ts` references Jupiter Price API V3 in code + comment; submission writeup cites it.

## Unresolved questions

1. Jupiter Quote API for deposit swap flow — wire in this phase or strictly post-Phase-8? (Bounty depth depends.)
2. Birdeye free tier daily-call ceiling under demo traffic — risk hitting it during pitch?
3. Stale-pill exact wording + placement: near NAV value, or in chart toolbar?
4. Period-Return: signed % with arrow + color, or signed mono number with delta component reused?
5. Featured-card sparkline source — reuse 1W series from `/api/vaults/:id/nav`, or trim to a smaller `/api/vaults/:id/spark` endpoint to save bytes?
6. Single-vault-only state on Discover (today's seed) — render 1-up vs 3-up featured row?
7. Ticker update cadence on the page — match server 30s cache, or poll at 5s and let server cache absorb?
8. NAV "per share" semantic — basket points (sum of weighted prices, ~$200ish range) or normalized to 100 at vault inception? Affects the headline number's vibes.
9. On-chain inception derivation — punt with DB-order Newest, or do the one RPC call per vault on cold start to backfill `inception_at`?
10. Fee values displayed as "10.00%" or "10%" (current Mono format) — confirm.
