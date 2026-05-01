# Plan: tokens.xyz-grade Visual Redesign

> Source PRD: `prd/2026-05-01-visual-redesign.md`

## Architectural decisions

Durable across all phases:

- **Routes**: unchanged. `/` (Discover), `/fund/$id` (Vault Detail), `/portfolio`, `/settings`. No new routes.
- **Schema / API / data layer**: NO changes. Visual-layer rewrite. Existing TanStack Query hooks (`useVaults`, `useVault`, `usePositions`, `usePendingOrders`), Privy integration, route loaders all preserved.
- **Tokens**: live in `:root` CSS custom properties in `pwa/src/index.css`; Tailwind v4 references via `@theme inline`. Single source of truth. shadcn semantic tokens (`--background`, `--card`, `--primary`, `--ring` etc.) remapped to new spec tokens so every existing surface adopts the new look without page-level edits.
- **Component variants**: stay in CVA. Rebuild variants in place — do not fork shadcn files.
- **Motion**: `framer-motion` for layout/exit/enter + spring. Every motion primitive checks `useReducedMotion()` and degrades to opacity-only or static. SVG path-length stroke for chart/checkmark draws. CountUp via custom hook for tickers.
- **Numerics**: every $/%/count routes through `<MonoNumber value format="usd|pct|count" />`. Tabular features always on.
- **Charts**: `recharts` wrapped in `nav-chart.tsx`. Chart enter animation gated by `IntersectionObserver` so off-screen charts don't pre-fire.
- **Fonts**: Geist Sans Variable + Geist Mono Variable via `@fontsource-variable/*`. Figtree removed.
- **Accent**: Cobalt `oklch(0.45 0.205 263)` (≈ #024CC7) — locked. Restraint cap: ≤4 Cobalt surfaces per page.
- **Mobile nav**: existing bottom tab bar **kept and restyled** to new tokens. Sticky bottom CTAs on detail page must inset above the tab bar height + `safe-area-inset-bottom`.
- **Storybook**: stories for every new variant including surface components (featured-card, composition-list, nav-chart, deposit-panel, etc.).
- **A11y**: `prefers-reduced-motion: reduce` honored sitewide. Cobalt focus rings via `--shadow-glow-accent` on every interactive.
- **⌘K palette**: deferred to Phase 7 (P1). Search pill placeholder in nav from Phase 2.

---

## Phase 1: Foundation — tokens, fonts, primitives

**User stories**: 13, 14, 17 (partial)

### What to build

Repaint the entire app by replacing the CSS token layer and rebuilding primitive component variants. Wire shadcn semantic tokens through to the new spec tokens so every existing route immediately renders in the new visual language without page-level changes. Establish type scale, radii, and shadow vocabulary in `@theme`. Rebuild CVA variants for `button`, `card`, `input`, `badge`. Add primitives `pill`, `delta`, `mono-number`, `tab-pill`. Storybook stories accompany every primitive.

### Acceptance criteria

- [x] `:root` rewritten with `--bg-canvas`, `--bg-canvas-glow`, `--surface`, `--surface-muted`, `--ink`, `--ink-muted`, `--ink-faint`, `--hairline`, `--accent`, `--accent-ink`, `--positive`, `--negative`, `--cta`, `--cta-ink`
- [x] Radii tokens: `--radius-pill` (9999px), `--radius-card` (20px), `--radius-input` (12px), `--radius-tag` (8px)
- [x] Shadow tokens: `--shadow-card`, `--shadow-cta`, `--shadow-glow-accent`
- [x] shadcn semantic tokens (`--background`, `--card`, `--primary`, `--ring`, etc.) remapped to new tokens — all existing pages adopt new look with zero page-level edits
- [x] Geist Sans Variable + Geist Mono Variable installed and imported in `index.css`; Figtree removed from `index.css` and `package.json`
- [x] `@theme inline` exposes type scale: `display-xl/lg/md`, `heading`, `body`, `body-sm`, `mono-xl/md/sm`, `pill` — mono variants ship with `tabular-nums`
- [x] Button rebuilt in CVA: `primary` (black pill), `primary-accent` (Cobalt pill), `secondary`, `ghost`, `outline`, `icon` (36px circular). Active state: `translateY(1px)` + shadow reduce 80ms
- [x] Card uses `--shadow-card` + 20px radius + 24px padding desktop / 20px mobile; hover `translateY(-1px)` + shadow lift 200ms
- [x] Input has pill + search variants; focus state lifts to white + Cobalt hairline + glow ring
- [x] Badge extended with `ticker` ($BTC mono uppercase), `count` (uppercase + chevron), `verified` (scalloped + check, Cobalt-tinted), `delta` (▲/▼ + tabular % + +/− color) variants
- [x] New primitives: `pill.tsx`, `delta.tsx`, `mono-number.tsx` (formats usd|pct|count), `tab-pill.tsx` (segmented container, layoutId-ready)
- [x] Lucide stroke-width set to 1.5 globally
- [x] Storybook stories for every new/rebuilt primitive (all variants + states)
- [x] `pnpm dev` clean on every existing route; `pnpm build` clean; `pnpm storybook` clean <!-- storybook smoke not run this session; build+typecheck clean -->


---

## Phase 2: App shell — top nav, motion scaffolding, Privy theming

**User stories**: 17, 21

### What to build

Restructure top nav per spec (desktop = wordmark + cluster-mark + search pill + Docs + wallet; mobile = wordmark + search icon + avatar pill). Sticky behavior with hairline border on scroll past 32px. Repaint the existing bottom mobile tab bar to new tokens (structure unchanged). Wallet button lifecycle: outline pill → on connect, avatar pill (wallet icon + truncated address + chevron) with dropdown (Disconnect / Settings / Copy address). Privy modal themed via `appearance` prop. Install `framer-motion`. Add page-enter motion wrapper in `__root.tsx`. Ship motion primitives `Reveal`, `Stagger`, `LayoutPill`, `PathDraw`, `Ticker` — all reduced-motion-aware.

### Acceptance criteria

- [x] `framer-motion` installed
- [x] Top nav restructured per spec on desktop and mobile breakpoints
- [x] Search pill placeholder rendered (⌘K functionality deferred to Phase 7)
- [x] Top nav becomes sticky with hairline bottom border animating in past 32px scroll
- [x] Bottom mobile tab bar repainted with new tokens (radii, surface, ink colors); structure unchanged
- [x] Wallet button: outline pill when disconnected; avatar pill (wallet icon + truncated address + chevron) when connected; dropdown actions wired (Disconnect / Settings / Copy address)
- [x] Privy modal `appearance` themed for warm-cream surfaces, ink text, Cobalt accent — verified at desktop + mobile <!-- themed via main.tsx; visual verification pending Chrome install -->
- [x] `__root.tsx` wraps `<Outlet/>` in page-enter motion (fade + slide-up 8px, 280ms out-quart) keyed by route
- [x] Motion primitives shipped: `Reveal`, `Stagger`, `LayoutPill` (Framer `layoutId` capsule), `PathDraw` (SVG path-length stroke), `Ticker` (CountUp 800ms ease-out)
- [x] Every motion primitive honors `useReducedMotion()` (degrades to opacity-only or static)
- [x] Storybook stories for nav variants (desktop / mobile / scrolled / connected / disconnected) and motion primitives
- [x] `pnpm dev` clean; transitions feel intentional across all existing routes

---

## Phase 3: Vault Detail (`/fund/$id`) — chart-first vertical

**User stories**: 5, 6, 7, 8, 9, 19, 20

### What to build

Restructure `/fund/$id` to 2-column desktop / stacked mobile. Asset header (logo + name + verified + ticker pill + holdings pill + icon row) → hairline → NAV price block (mono-xl + delta + date) → NAV chart hero (Recharts: Cobalt 2.25px line, vertical area gradient Cobalt 24%→0%, mono-sm right Y-axis, no axis lines, hover hairline + Cobalt dot + halo + tooltip). Time-period pills below-left with `LayoutPill` capsule + chart re-stroke on switch. Camera/share icon button bottom-right. Stats grid (TVL, 24h Volume, # Holders, Performance Fee, Mgmt Fee, Inception — 2x3) with stagger. Numbered aggregator-style composition list. Sticky right deposit panel (desktop): Deposit/Withdraw/History tabs, mono amount input + USDC suffix + Max, estimated shares, fee row, black pill CTA. About + News (≤3 cards). Mobile: deposit panel rendered inside Sheet, opened by sticky bottom CTA inset above the bottom tab bar. NAV ticker. Deposit success: white checkmark `PathDraw` on Cobalt circle. Chart enter gated by IntersectionObserver.

### Acceptance criteria

- [x] `recharts` installed
- [x] `/fund/$id` renders 2-column on desktop (≥1024px), single-column stacked below
- [x] Asset header: desktop = logo (80px) + name stack + flex spacer + icon row; mobile = logo (96px) + name + verified inline + pill row + kebab top-right
- [x] NAV price block uses `mono-xl` for value + `delta` component for change
- [x] `nav-chart.tsx` Recharts wrapper: line/area/grid/axes/hover/tooltip per spec
- [x] Chart enter: SVG path-length stroke draw 700ms out-quart → area opacity fade 400ms; gated by IntersectionObserver
- [x] Time-period pills use `LayoutPill` (`layoutId="time-pill"`); switch re-strokes chart 600ms <!-- impl uses 700ms (durations.chartLine token); cosmetic delta -->
- [x] Camera/share icon button (36px circular icon variant) bottom-right of chart container
- [x] Stats grid (2x3) animates with `Stagger` 40ms
- [x] `composition-list.tsx`: numbered (mono-sm ink-faint) + 24px logo + name + weight % (mono-md) + 24h delta (mono-sm color-coded); row hover surface-muted, links to underlying ticker
- [x] Desktop `deposit-panel.tsx`: sticky right column 360px, tabs (Deposit/Withdraw/History), mono amount input with USDC suffix + Max mini-button, estimated shares, fee disclosure, primary black pill "Deposit USDC"; History lists past txns with explorer link arrow
- [x] Mobile: deposit panel rendered inside shadcn `Sheet`, opened by `sticky-cta.tsx` "Deposit USDC v"
- [x] Sticky CTA spring-in on first viewport entry (stiffness 280, damping 30); inset = `safe-area-inset-bottom` + bottom-tab-bar height + 16px
- [x] NAV value uses `Ticker` for animated changes
- [x] Deposit success: Cobalt circle + white checkmark `PathDraw` 500ms
- [x] About section (paragraph + Read more chevron) and News section (≤3 cards: thumbnail + source + headline) shipped
- [x] Storybook stories for `nav-chart`, `composition-list`, `deposit-panel`, `sticky-cta`, deposit success state
- [x] All numerics route through `MonoNumber`
- [x] Reduced-motion respected on chart, ticker, sticky CTA, success animation

---

## Phase 4: Discover (`/`) — hero + featured + table

**User stories**: 1, 4

### What to build

Restructure `/` to: top nav → hero band ("Curated stock baskets on Solana." display-md + Cobalt arrow CTA "Browse vaults") → filter tab strip (All / Stocks / ETFs / Themes / Sectors) using `LayoutPill` → 3-up featured cards (Trending / Top Performer 24H / Newest, ~280px tall, name + ticker pill + sparkline + NAV + delta, hover lift) → vault table (Name / TICKER / NAV / 24h / 7d / TVL / Holders / Inception, hairline rows, no outer border, mono numerics right-aligned, row hover surface-muted, click → /fund/$id) → minimal footer.

### Acceptance criteria

- [ ] Hero band: display-md headline + Cobalt arrow primary-accent CTA
- [ ] Filter tab strip uses `LayoutPill` (`layoutId="discover-filter"`); selected = white capsule + ink text; unselected = flat ink-muted with ink hover
- [ ] `featured-card.tsx`: name + ticker pill + inline sparkline + NAV (mono) + delta, fixed ~280px, hover translateY(-1px) + shadow lift
- [ ] 3-up featured row sourced from existing vault hooks (Trending / Top Performer 24H / Newest)
- [ ] `vault-row.tsx`: 28px logo (chain badge bottom-right where applicable) + name + ticker + mono numerics for NAV/24h/7d/TVL/Holders/Inception, right-aligned numerics
- [ ] Vault table: no outer border, hairline row dividers, header row `body-sm` ink-muted with sortable hover underline, row hover surface-muted, click → `/fund/$id`
- [ ] Motion: hero fade-up 280ms; featured cards stagger 80ms; table rows stagger 30ms
- [ ] Minimal footer (wordmark + links)
- [ ] `useVaults` hook unchanged
- [ ] Storybook stories for `featured-card`, `vault-row`, hero band, filter tab strip
- [ ] Reduced-motion respected on entrance animations

---

## Phase 5: Portfolio (`/portfolio`) — NAV hero + chart + tabs

**User stories**: 10, 11

### What to build

Restructure `/portfolio` to: NAV summary hero (Total Value mono-xl + delta + "all time" toggle) → portfolio chart (reuse `nav-chart.tsx`, full-width, 1Y default) → Holdings/Activity tab capsule → Holdings list (logo + name + ticker pill + units mono + value mono + 24h delta + Manage ghost button) → Activity chronological list (date + action chip + vault + amount + tx-hash explorer link). Empty state when no holdings: editorial illustration slot + Cobalt CTA "Discover vaults" → `/`.

### Acceptance criteria

- [ ] NAV summary hero: Total Value `mono-xl` + delta + "all time" toggle
- [ ] Portfolio chart reuses `nav-chart.tsx`, full-width, defaults to 1Y range
- [ ] Tab capsule via `LayoutPill` (`layoutId="portfolio-tabs"`): Holdings | Activity
- [ ] Holdings rows: 28px logo + name + ticker pill + units (mono) + value (mono) + 24h delta + Manage ghost button → `/fund/$id`
- [ ] Activity rows: date + action chip + vault + amount + tx-hash explorer link arrow, chronological
- [ ] Empty state: editorial illustration placeholder + display-md headline + primary-accent "Discover vaults" CTA → `/`
- [ ] `usePositions` and pending orders hooks unchanged
- [ ] Page-enter motion + stagger applied; reduced-motion respected
- [ ] Storybook stories for empty state, holdings row, activity row

---

## Phase 6: Auth + first-touch onboarding

**User stories**: 12, 21

### What to build

Refine Privy modal theming (built earlier in Phase 2 nav, polished here against the now-shipped surfaces). Post-connect, if user has zero holdings, route to a full-page editorial onboarding moment: display-xl "Welcome to instinct.", display-md subline "Curated baskets, one click.", Cobalt arrow `PathDraw` → primary-accent CTA "Browse vaults". Words type-cascade 40ms each; arrow draws 600ms.

### Acceptance criteria

- [ ] Privy modal theme verified against final tokens at desktop + mobile breakpoints
- [ ] Onboarding view rendered post-connect when `usePositions` returns empty
- [ ] Display-xl "Welcome to instinct." + display-md subline laid out per spec
- [ ] Word-cascade type animation 40ms per word; reduced-motion → instant render
- [ ] Cobalt arrow `PathDraw` 600ms out-quart; reduced-motion → static arrow
- [ ] Primary-accent CTA "Browse vaults" → `/`
- [ ] First-onboarding-seen flag persisted (localStorage) to avoid re-trigger on later connects
- [ ] Storybook stories for onboarding view (with + without reduced motion)

---

## Phase 7: Polish — ⌘K, audits, a11y, pitch prep

**User stories**: 2, 3, 14, 15, 16, 18

### What to build

Install `cmdk`. Build ⌘K command palette (shadcn Dialog + Command, indexes vaults, keyboard-navigable). Refresh `/settings` to new tokens + nav (no structural restructure per PRD scope). Replace generic skeletons with shape-matching skeletons (vault card, table row, chart, deposit panel, composition list) using calmer 2s pulse. Cold-load mask: cream bg + wordmark fade-in to mask network on initial visit. Color audit (no `#FFFFFF` page bg, no pure `#000` text). Accent restraint audit (≤4 Cobalt surfaces per page). Keyboard focus-ring pass. `prefers-reduced-motion` verification across every animation. Lighthouse mobile a11y ≥ 95, perf ≥ 85. 375px / 768px / 1440px pass on all 4 surfaces. Favicon + OG image refresh.

### Acceptance criteria

- [ ] `cmdk` installed; ⌘K palette opens from search pill + ⌘K shortcut, indexes vault list, keyboard-navigable, navigates to `/fund/$id` on select
- [ ] `/settings` repainted with new tokens + Phase 2 nav; no structural restructure
- [ ] Shape-matching skeletons shipped: vault-card, table-row, chart, deposit-panel, composition-list — 2s pulse
- [ ] Cold-load mask: cream bg + wordmark fade-in renders before first hydration paint
- [ ] Color audit: zero `#FFFFFF` and zero pure `#000` references in page-level styles (raw hex search clean; everything routed through tokens)
- [ ] Accent restraint audit: each of `/`, `/fund/$id`, `/portfolio` uses Cobalt on ≤4 distinct surfaces; excess flagged and trimmed
- [ ] Keyboard tab-through every interactive on every surface produces visible Cobalt focus ring
- [ ] `prefers-reduced-motion: reduce` honored sitewide (no transforms, fades only) — verified manually
- [ ] Lighthouse mobile (incognito, throttled): a11y ≥ 95, perf ≥ 85
- [ ] All 4 surfaces verified at 375px / 768px / 1440px against PRD page specs
- [ ] Favicon + OG image refreshed
- [ ] `pnpm build` / `pnpm typecheck` / `pnpm lint` / `pnpm storybook` all clean

---

## Phase 8: Real-world data integration

**User stories**: 5, 6, 7, 19, 20

### What to build

Phases 1–7 ship the visual layer with deterministic-from-vault.id mock data on the detail page (NAV chart series, per-holding 24h delta, stats, news). Phase 8 replaces those mocks with real sources end-to-end. Detailed scope, source selection, and acceptance criteria deferred — to be filled in after Phase 7 review against the surfaces as shipped.

### Mocks to retire (current locations)

- `generateMockNavData` in `pwa/src/routes/fund.$id.tsx` → real NAV history feed
- per-holding `delta24h` derivation in the same file → real per-stock quote feed
- `deriveVaultStats` (TVL, 24h volume, holders, perf/mgmt fees, inception) → real stats
- `mockNewsFor` → real news source
- portfolio-side equivalents introduced in Phase 5 (TBD)

### Open scope (placeholder)

- [ ] NAV history endpoint contract + caching strategy
- [ ] Per-stock quote feed (oracle vs aggregator, polling vs websocket)
- [ ] On-chain stat derivations (TVL = supply × NAV, holders via indexer)
- [ ] News source + tickers→headlines mapping
- [ ] Loading + stale-data UX
- [ ] Reduced-motion + IntersectionObserver still gate chart enter animation across real-data refreshes

---

## Unresolved questions

1. Wordmark — keep `instinct` lowercase + period, or different lockup?
2. Composition data — real underlying tokens by pitch, or mock?
3. Pitch date? Drives motion-pass depth + Phase 7 scope.
4. Phantom-style approval flow via Privy, or simulated for demo?
5. Install Chrome via `npx playwright install chrome` now (frontend-design references), or defer?
6. Ticker convention — `$INSTNCT-MAG7`, `$IMAG7`, or no `$`?
7. Onboarding moment (Phase 6) — keep, or skip and route straight to Discover?
8. Bottom mobile tab bar kept — confirm no clash with sticky CTA on `/fund/$id` mobile (CTA insets above tab bar)?
9. Inter fontsource (`@fontsource-variable/inter`) — rip alongside Figtree, or leave?
10. Editorial illustration slots (Portfolio empty, onboarding) — assets coming, or pure placeholder for pitch?
