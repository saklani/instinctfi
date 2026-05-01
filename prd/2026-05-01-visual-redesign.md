# instinctfi — tokens.xyz-grade Visual Redesign

## Context

- Pitching to investors. Current UI is clean shadcn baseline but visually generic — a senior investor will not lean in.
- Reference: `tokens.xyz` (light, warm-cream, dense fintech, restrained, charts + sticky black CTA). Strategic decision = **inspired-by translation**, not pixel clone — adopt vocabulary + craft, swap content model from tokens → vaults, introduce **one signature accent** for instinctfi differentiation.
- Stack already aligned: Vite + React 19 + Tailwind v4 + shadcn/ui + Radix + Figtree. We rebuild design tokens in place — no migration.
- All four surfaces P0 for pitch: Discover, Vault Detail, Portfolio, Auth/Wallet Connect.
- Motion ambition = **full motion design pass** (Framer Motion installed, choreographed reveals, route transitions, number tickers, chart enter, sticky CTA spring).

## Problem Statement

> "My app does not look good. I have to pitch investors and I cannot fail."

The current UI reads as "shadcn default" — pure white, tight 10px radii, neutral grays, no signature, no motion personality. Investors who have seen tokens.xyz, Polymarket, Kamino, Drift, and Phantom will pattern-match this as a hackathon prototype, not a product. The product itself ("curated tokenized stock baskets on Solana") is investable; the visual story is not.

## Solution

Redesign the visual layer to a **warm-neutral, data-dense, motion-confident** language modeled on tokens.xyz, with one signature accent (Cobalt by default — see decisions) replacing tokens.xyz's monochrome restraint as the instinctfi-ness. Ship 4 surfaces with end-to-end choreography (load-in, hover, focus, route, chart enter, deposit success) — every interaction feels intentional.

---

## Design Direction

**One-line:** *"Bloomberg-meets-Phantom: warm fintech-paper background, near-black ink, surgical Cobalt accent, monospace numbers, chart-forward, restrained-but-deliberate motion."*

**Reads as:** quiet confidence. Not crypto-bro. Not enterprise. Editorial-financial.

**Signature moves:**
1. **Warm cream background** (not white) with subtle radial top-glow. This single move kills the "shadcn default" smell instantly.
2. **Monospace tabular numerics everywhere** — prices, deltas, weights, TVL. Numbers feel weighed.
3. **Chart-first detail page** — the chart is the hero, not buried under stats.
4. **Sticky black pill CTA on mobile** — pure black, full-width, spring-in on scroll. The single most pitch-memorable component.
5. **Cobalt accent** used surgically: chart line, primary CTA hover halo, focus ring, active-tab indicator, single hero numeric.
6. **Numbered aggregator-style list** treatment for vault composition (1. AAPL, 2. NVDA, 3. MSFT…) — borrows tokens.xyz's authoritative-list voice.

---

## Design System Spec

### Color tokens (rewrite `pwa/src/index.css` `:root`)

| Token | Value | Use |
|---|---|---|
| `--bg-canvas` | `oklch(0.985 0.005 80)` (~#FCFAF6) | Page background |
| `--bg-canvas-glow` | radial gradient: `oklch(0.99 0.005 85)` top → `--bg-canvas` 60% | Subtle warm lift behind hero |
| `--surface` | `oklch(0.995 0.003 85)` (~#FDFCF9) | Cards, sidebar panel |
| `--surface-muted` | `oklch(0.95 0.005 80)` (~#EBE9E3) | Pills, chip fills |
| `--ink` | `oklch(0.13 0 0)` (~#0E0E0E) | Primary text, headlines |
| `--ink-muted` | `oklch(0.50 0 0)` (~#7B7B7B) | Secondary labels, axis ticks |
| `--ink-faint` | `oklch(0.70 0 0)` (~#A8A8A8) | Hairlines, disabled |
| `--hairline` | `oklch(0.92 0.003 80)` (~#E5E2DD) | Dividers, borders |
| `--accent` | `oklch(0.45 0.205 263)` (#024CC7 Cobalt) | Signature; CTAs hover, focus rings, chart line, hero numeric |
| `--accent-ink` | `oklch(0.99 0 0)` (white) | Text on Cobalt fills |
| `--positive` | `oklch(0.66 0.16 150)` (~#3DB97A) | + delta |
| `--negative` | `oklch(0.62 0.20 25)` (~#E04E50) | − delta |
| `--cta` | `oklch(0.13 0 0)` (~#0E0E0E) | Black sticky button fill |
| `--cta-ink` | `oklch(0.99 0 0)` (white) | Black button text |

> Decision: **Cobalt is the recommended accent.** Three alternates listed in unresolved questions if user wants to override.

### Typography

- **Display + body**: **Geist Sans Variable** (replaces Figtree). Geometric, modern, crypto-native, free.
- **Numerics**: **Geist Mono Variable** (or **JetBrains Mono**) for ALL prices, deltas, weights, TVL, % values, axis labels. Tabular features on.
- Install via `@fontsource-variable/geist` and `@fontsource-variable/geist-mono`. Rip Figtree.

**Type scale** (Tailwind v4 `--text-*`):

| Token | Size / Line / Tracking | Use |
|---|---|---|
| `display-xl` | 56/60, -0.03em | Hero NAV / hero number |
| `display-lg` | 40/44, -0.025em | Asset name in detail header |
| `display-md` | 32/36, -0.02em | Page section title |
| `heading` | 20/26, -0.01em | Section h2 (Stats, About, News) |
| `body` | 15/22, 0 | Default body |
| `body-sm` | 13/18, 0 | Secondary, labels |
| `mono-xl` | 44/48, -0.02em, tabular | Hero price |
| `mono-md` | 15/22, tabular | Inline prices, table values |
| `mono-sm` | 12/16, tabular, +0.02em | Axis ticks, table micro-values |
| `pill` | 11/14, +0.06em uppercase | $TICKER, "8+ HOLDINGS" pills |

### Spacing & Radii

- Spacing scale stays 4px base. Section vertical rhythm: 24 / 32 / 48 / 64.
- **Radii (rebuild `--radius` tokens):**
  - `--radius-pill`: 9999px (pills, time-period buttons, sticky CTA, search input, icon buttons)
  - `--radius-card`: 20px (sidebar card, news cards, deposit panel)
  - `--radius-input`: 12px (text inputs, dropdown menus)
  - `--radius-tag`: 8px (small chips, badges)
  - Avatars/logos: full circle.

### Shadows (very soft, layered)

- `--shadow-card`: `0 1px 2px rgba(20,16,8,0.04), 0 8px 24px -8px rgba(20,16,8,0.06)`
- `--shadow-cta`: `0 8px 24px -6px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)`
- `--shadow-glow-accent`: `0 0 0 4px oklch(0.45 0.205 263 / 0.22)` — focus ring, chart hover dot halo
- No drop-shadows on cards in body. Restraint.

### Motion principles

- **Easing**: `cubic-bezier(0.22, 1, 0.36, 1)` (gentle out-quart) for most. Spring for CTAs.
- **Durations**: hover 160ms; route 280ms; chart enter 700ms; number ticker 800ms; stagger 40ms.
- **Choreography rules**:
  - Page enter: header fades 200ms → hero block fades+slides up 280ms → chart line draws 700ms (path-length stroke) → area fill 400ms after → stats grid stagger 40ms each.
  - Hover on table row: surface tone shifts to `--surface-muted` 160ms.
  - Time-pill switch: spring (stiffness 360, damping 28) on the moving capsule indicator (Framer Motion `layoutId`).
  - Number changes: ticker animation (CountUp w/ ease-out 800ms).
  - Sticky bottom CTA mobile: spring-in on first viewport entry; on scroll-up, linger; on scroll-down, slight depth reduction.
  - Deposit success: confetti is too much — instead, white checkmark draws on Cobalt circle (lottie or SVG path stroke), 500ms.

### Iconography

- Keep Lucide React. No swap.
- Stroke-width 1.5 globally (currently default 2 reads heavy).
- Icon buttons in chart toolbar: 36px circular, ghost ink, hairline border on hover.

---

## Component Vocabulary

### Top nav

- **Desktop**: `instinct.` wordmark + cluster-mark left | search pill input center (450px max, ⌘K hint chip) | "Docs" + wallet button right.
- **Mobile**: wordmark left | search icon button right. Wallet status as a small avatar pill (truncated `7Hk…1pE`).
- Sticky, hairline bottom border on scroll past 32px (animate in).

### Search input

- Pill-shaped, `--surface-muted` fill, 44px height desktop / 40px mobile.
- Magnifier icon left, ⌘K chip right (desktop only).
- Focus state: surface lifts to white, hairline → Cobalt at 50% opacity, glow ring.
- Opens command-menu modal (radix `Dialog` + `Command` from cmdk).

### Pills / badges

- 4 variants: `ticker` ($BTC style, mono uppercase), `count` ("8+ HOLDINGS", uppercase, chevron-down if interactive), `verified` (scalloped circle + check, Cobalt-tinted on instinctfi-curated vaults), `delta` (▲/▼ icon + % in tabular mono, positive/negative color).

### Cards

- Default card: `--surface` fill, `--shadow-card`, 20px radius, 24px internal padding desktop / 20px mobile.
- Subtle hover: shadow softens up by 1 layer, transform `translateY(-1px)` 200ms.
- VaultCard on Discover keeps Link wrapping.

### Buttons

| Variant | Style | Use |
|---|---|---|
| `primary` | Pure black fill, white text, pill, `--shadow-cta` | Deposit USDC, Connect Wallet, Buy [Vault] |
| `primary-accent` | Cobalt fill, ink text, pill | One-of-one moments — hero CTA on auth/empty states |
| `secondary` | `--surface-muted` fill, ink text, pill | Cancel, secondary actions |
| `ghost` | Transparent, ink text, hover surface-muted | Tab nav, kebab menus |
| `outline` | Hairline border, transparent, ink text | Filter chips |
| `icon` | Circular 36px, ghost, hairline on hover | Chart toolbar, header icons |

Active state: all buttons get `translateY(1px)` + shadow reduce, 80ms.

### Tabs (segmented control)

Pill-container with a moving capsule indicator (Framer Motion `layoutId="tab-pill"`). Selected = white capsule fill, ink text. Unselected = flat ink-muted, hover ink. Use for: Swap/Deposit/Withdraw on detail sidebar, filter tabs on Discover (All / Stocks / ETFs / Themes / Sectors).

### Tables

- No outer border. Hairline `--hairline` row dividers.
- Header row: `body-sm` ink-muted, sortable columns get hover underline.
- Cell numbers: `mono-md`, right-aligned for numerics, left for text.
- Row hover: `--surface-muted` fill 160ms, cursor pointer.
- Logo cells: 28px circular, with chain badge bottom-right when applicable.

### Chart wrapper

- Library: **Recharts** (already in shadcn ecosystem) OR **Visx** if perf needed. Recommend Recharts to start.
- Line stroke: `--accent` (Cobalt) at 2.25px, with anti-aliased rounded caps.
- Area fill: vertical gradient Cobalt 24% → 0% over 80% of height.
- Y-axis: right-aligned, mono-sm, ink-faint, no axis line, 4 grid lines max (dashed `--hairline`).
- X-axis: bottom, mono-sm, ink-faint, no axis line.
- Hover: vertical hairline + filled Cobalt dot (8px) + outer halo `--shadow-glow-accent` + tooltip card (`--surface`, `--shadow-card`, mono content).
- Time-period pills below-left of chart container.
- Camera/share button bottom-right (icon variant button).
- **Enter animation**: SVG path-length stroke draws over 700ms ease-out, then area fades in 400ms.

### Sticky bottom CTA (mobile only)

- Fixed bottom, 16px inset from edges + `safe-area-inset-bottom`.
- Pure black pill, white text, full width, 56px height, mono-sm label + chevron-down if it expands a sheet.
- Slides in from below with spring on initial mount (stiffness 280, damping 30).
- Tapping opens deposit sheet (`Sheet` from shadcn, radix).

### Sidebar deposit panel (desktop only on detail page)

- Sticky right column, 360px wide, `--shadow-card`, 20px radius, 24px padding, `--surface` fill.
- Top: tabs `Deposit | Withdraw | History`.
- Body (deposit tab):
  - Amount input: large mono-md, USDC suffix, "Max" mini-button.
  - Estimated shares output: smaller, ink-muted label + mono-md value.
  - Fee disclosure row: subtle, `body-sm` ink-muted.
  - Primary black pill CTA "Deposit USDC".
- Body (history tab): vertical list of past txns w/ explorer link arrow.

### Hero asset header (vault detail)

- Layout (desktop): logo (80px) | stack(name + verified + ticker pill + holdings pill) | flex spacer | icon row (search, share, X, comments).
- Layout (mobile): logo (96px) → name + verified inline → pill row below → kebab top-right.
- Below: hairline divider → price block.

### Aggregator-style list (composition)

- Reuses tokens.xyz's "Aggregators" pattern for **vault composition**:
  - Numbered (1, 2, 3 in mono-sm ink-faint left)
  - Logo (24px circular)
  - Holding name (Geist Sans medium)
  - Right-side: weight % (mono-md) + 24h delta (mono-sm color-coded)
  - Hover row: `--surface-muted`, cursor pointer (links to underlying ticker)

### Empty / loading / skeleton

- Skeletons inherit surface tone, animate via `animate-pulse` with longer 2s cycle (calmer than default).
- Empty states get a small editorial illustration slot (deferred — placeholder text + Cobalt arrow).

---

## Page Specs

### `/` Discover (mirrors tokens.xyz home)

```
[ sticky top nav ]
[ hero band: "Curated stock baskets on Solana." (display-md, 2 lines max) + Cobalt arrow CTA "Browse vaults" ]
[ tab strip: All | Stocks | ETFs | Themes | Sectors ]
[ 3-up featured cards: "Trending" / "Top Performer 24H" / "Newest" ]
   each card: vault name + $TICKER + sparkline + NAV + delta — ~280px tall, hover lift
[ vault table: Name | $TICKER | NAV | 24h | 7d | TVL | Holders | Inception ]
   row hover surface-muted, click → /fund/$id
[ footer: minimal — wordmark + links ]
```

Motion: hero band fade-up 280ms; featured cards stagger 80ms; table rows fade 200ms with 30ms stagger.

### `/fund/$id` Vault Detail (mirrors tokens.xyz/bitcoin)

```
[ sticky top nav ]
[ breadcrumb: Discover > [Vault Name] ]
DESKTOP 2-COLUMN BELOW (mobile stacks):
LEFT (~70%):
  [ asset header: logo + name + verified + $TICKER + N HOLDINGS pill + icon row ]
  [ hairline ]
  [ NAV price block: mono-xl + delta + date ]
  [ chart container: line+area + Y-axis right + time-pills bottom-left + camera bottom-right ]
  [ Stats heading ]
  [ stats grid: TVL, 24h Volume, # Holders, Performance Fee, Mgmt Fee, Inception — 2x3 desktop, 2x3 mobile ]
  [ Composition heading ]
  [ aggregator-style list: each underlying holding numbered + logo + name + weight % + 24h delta ]
RIGHT (~30%):
  [ deposit panel sticky card: tabs (Deposit/Withdraw/History) + amount input + estimated shares + black CTA ]
  [ About this vault: paragraph + Read more chevron ]
  [ News: up to 3 cards with thumbnail + source + headline ]
MOBILE:
  [ same vertical stack, deposit panel BECOMES sticky bottom CTA "Deposit USDC v" → opens Sheet w/ panel inside ]
```

Motion: chart line stroke-draw 700ms; stats stagger; deposit panel slides up from right (desktop) or bottom (mobile) on first load.

### `/portfolio`

```
[ sticky top nav ]
[ hero NAV summary: "Total Value" mono-xl + delta + "all time" toggle ]
[ portfolio chart: same chart component, full-width, 1Y default ]
[ tabs: Holdings | Activity ]
HOLDINGS:
  [ list of owned vault rows: logo + name + $TICKER + units mono + value mono + 24h delta + "Manage" ghost button ]
ACTIVITY:
  [ chronological list: date + action chip + vault + amount + tx-hash explorer link ]
[ empty state if no holdings: editorial illustration + "Discover vaults" Cobalt CTA ]
```

### Auth / Wallet Connect

- Uses Privy (already integrated). Skin Privy's modal where possible via theme prop.
- Connect button in nav: outline pill "Connect Wallet" → on connect, becomes avatar pill (Phantom/Solflare icon + truncated address + chevron, dropdown w/ Disconnect / Settings / Copy address).
- First-touch onboarding (post-connect, no holdings yet): full-page editorial moment — display-xl headline "Welcome to instinct.", display-md subline ("Curated baskets, one click."), animated Cobalt arrow → "Browse vaults" primary-accent CTA. Motion: words type-cascade 40ms each, arrow draws path 600ms.

---

## Motion Spec (consolidated)

| Surface | Trigger | Animation | Duration | Easing |
|---|---|---|---|---|
| Page enter | route change | fade + slide-up 8px | 280ms | out-quart |
| Hero block | mount | fade + slide-up 16px | 320ms | out-quart |
| Chart line | mount + interval | path-length stroke draw | 700ms | out-quart |
| Chart area | after line | opacity 0→1 | 400ms | linear |
| Stats grid | mount | stagger fade-up | 40ms each | out-quart |
| Table rows | mount | stagger fade | 30ms each | out-quart |
| Tab switch | click | layoutId capsule slide | spring(360,28) | spring |
| Time-period switch | click | layoutId capsule + chart re-stroke | 600ms | out-quart |
| Number change | data update | CountUp ticker | 800ms | ease-out |
| Hover row | mouse-enter | bg color shift | 160ms | ease |
| Hover card | mouse-enter | translateY(-1px) + shadow lift | 200ms | out-quart |
| Sticky CTA mobile | initial mount | spring-in from below | spring(280,30) | spring |
| Deposit success | tx confirm | checkmark path-stroke on Cobalt circle | 500ms | out-quart |
| Wallet connect | onboard | word-cascade type + arrow draw | 40ms each + 600ms | out-quart |

Library: **Framer Motion** for layout/exit/enter + spring; **CountUp.js** or hand-rolled hook for tickers; **SVG path-length** for stroke draws (no extra dep).

---

## User Stories

1. As a Solana-savvy investor seeing instinctfi for the first time, I want the landing page to feel as polished as tokens.xyz/Phantom/Drift, so I take the founder seriously.
2. As an investor on a pitch projector, I want the colors to read accurately under poor lighting, so the design doesn't muddy.
3. As a mobile user opening the link from a tweet, I want the experience to feel native and fast, with a thumb-reachable persistent CTA.
4. As a user browsing Discover, I want the trending/top/newest baskets surfaced before I scroll, so I have a reason to engage in the first 3 seconds.
5. As a user evaluating a vault, I want the NAV chart to be the first thing I see (not buried), so I can assess performance immediately.
6. As a user evaluating a vault, I want to scan stats (TVL, holders, fees) in tabular form, so I can validate it's not vapor.
7. As a user evaluating a vault, I want to see exactly what's in the basket (composition table), so I trust what I'm depositing into.
8. As a user ready to deposit, I want the deposit panel to be one click away (sticky right card desktop, sticky bottom CTA mobile), so the conversion path is obvious.
9. As a user who deposited, I want a satisfying confirmation moment, so I feel my action mattered.
10. As a returning user on Portfolio, I want to see a clean Total Value with delta and a chart, before any tables, so my emotional read is "I'm winning/losing" first, then "details" second.
11. As a holder, I want to scan all my positions in a list with one-click manage, so navigation is single-step.
12. As a user who hasn't connected a wallet, I want a confident editorial onboarding moment, not a generic Connect-Wallet wall, so my first impression is brand, not friction.
13. As an investor reviewing the codebase, I want the design tokens encapsulated in CSS variables so they look intentional in a code review.
14. As a developer extending the system, I want every component variant to live in Storybook so contribution doesn't drift.
15. As a user with reduced-motion preference, I want all motion to respect `prefers-reduced-motion: reduce` so the app remains usable.
16. As a user on slow network, I want skeletons that match component shape (not generic gray blocks), so the perceived speed is high.
17. As a keyboard user, I want every interactive element to have a clear Cobalt focus ring, so I never get lost.
18. As a user using ⌘K, I want a command palette that searches vaults, so power-user friction is zero.
19. As a user hovering on the NAV chart, I want a clean tooltip with date + value, so data inspection is precise.
20. As a user, I want number changes (e.g. live NAV) to ticker-animate, so the page feels alive without being noisy.
21. As an investor who just saw tokens.xyz, I want instinctfi to feel familiar in craft but distinct in identity (Cobalt accent), so I don't write it off as a copy.

---

## Implementation Decisions

### Modules to modify
- `pwa/src/index.css` — full rewrite of CSS custom properties (color, radius, shadow, spacing).
- `tailwind.config` (or v4 config in CSS) — extend with new tokens, font families, type scale.
- Font setup — install `@fontsource-variable/geist` + `@fontsource-variable/geist-mono`, import in `index.css`, remove Figtree.
- `pwa/src/components/ui/*` — rebuild variants in CVA: `button.tsx`, `card.tsx`, `input.tsx`, `badge.tsx`, plus add `pill.tsx`, `delta.tsx`, `mono-number.tsx`, `chart-shell.tsx`, `tab-pill.tsx`, `sticky-cta.tsx`.
- `pwa/src/components/nav.tsx` — restructure top nav per spec.
- `pwa/src/routes/__root.tsx` — add page-enter motion wrapper.
- `pwa/src/routes/index.tsx` (Discover) — restructure to hero + 3-featured + tabs + table.
- `pwa/src/routes/fund.$id.tsx` — restructure to 2-column desktop / stacked mobile + chart-first + composition list.
- `pwa/src/routes/portfolio.tsx` — restructure to NAV summary + chart + tabs.
- `pwa/src/features/vaults/*` — rework `vault-card.tsx`, add `vault-row.tsx`, `composition-list.tsx`, `featured-card.tsx`.
- New: `pwa/src/components/motion/*` — `Reveal`, `Stagger`, `Ticker`, `PathDraw`, `LayoutPill`.
- New: `pwa/src/components/chart/nav-chart.tsx` (Recharts wrapper conforming to spec).
- Storybook: add stories for every new variant.

### Dependencies to install
- `framer-motion` (~11.x)
- `recharts` (or upgrade if present)
- `@fontsource-variable/geist` + `@fontsource-variable/geist-mono`
- (optional) `cmdk` for ⌘K palette
- Remove: `@fontsource-variable/figtree`

### Architectural decisions
- All design tokens live in CSS custom properties on `:root`; Tailwind v4 references them via `@theme inline` or `theme()`. Single source of truth.
- Component variants stay in CVA — keep current pattern, just rebuild the variants.
- Motion components accept a `disabled` prop respecting `useReducedMotion()` from Framer Motion.
- All numerics route through `<MonoNumber value={...} format="usd|pct|count" />` for consistent tabular rendering + ticker hooks.
- Shadcn theming: stay on shadcn defaults where possible, override via CSS vars instead of forking files.
- Chart enter animation gated behind `IntersectionObserver` so off-screen charts don't pre-fire.

### Schema / API — none changed
This is a visual-layer rewrite. No backend/contract/data-model changes. Existing TanStack Query hooks, Privy integration, route loaders all preserved.

---

## Critical Files

```
pwa/src/index.css                              — token rewrite ★ FIRST
pwa/src/components/ui/button.tsx               — variant overhaul
pwa/src/components/ui/card.tsx                 — radius/shadow overhaul
pwa/src/components/ui/input.tsx                — pill input + search variant
pwa/src/components/ui/badge.tsx                — extend to ticker/count/verified
pwa/src/components/nav.tsx                     — restructure
pwa/src/routes/__root.tsx                      — motion wrapper
pwa/src/routes/index.tsx                       — Discover redesign
pwa/src/routes/fund.$id.tsx                    — Detail redesign
pwa/src/routes/portfolio.tsx                   — Portfolio redesign
pwa/src/features/vaults/vault-card.tsx         — rebuild
pwa/src/features/vaults/featured-card.tsx      — NEW
pwa/src/features/vaults/composition-list.tsx   — NEW
pwa/src/features/vaults/vault-row.tsx          — NEW (table)
pwa/src/components/motion/*                    — NEW (Reveal/Stagger/Ticker/PathDraw)
pwa/src/components/chart/nav-chart.tsx         — NEW
pwa/src/components/sticky-cta.tsx              — NEW
pwa/src/components/deposit-panel.tsx           — NEW
pwa/package.json                               — deps add/remove
```

Reuse-where-possible: existing `cn` util (`pwa/src/lib/utils.ts`), CVA pattern, shadcn primitives (Sheet, Dialog, Tabs, Tooltip, ScrollArea), Radix accessibility.

---

## Implementation Order (tracer-bullet)

1. **Tokens + fonts swap** in `index.css` — instant ~40% visual lift. Verify on every existing page.
2. **Button + Card + Pill + MonoNumber primitives** rebuild — establishes vocabulary.
3. **Top nav** restructure.
4. **Detail page** (`/fund/$id`) end-to-end — chart + sidebar + composition. (Highest investor-leverage page; do first.)
5. **Discover** restructure — hero + featured + table.
6. **Portfolio** restructure.
7. **Auth / onboarding** moment.
8. **Motion pass** — Reveal, Stagger, Ticker, PathDraw, layoutId tabs/timepills.
9. **Storybook** entries.
10. **Mobile pass** — verify all 4 surfaces at 375px, sticky CTA, sheet conversions.
11. **Reduced-motion + a11y pass** — focus rings, keyboard, prefers-reduced.
12. **Pitch polish** — favicon, OG image, loading state for cold-load (cream bg + small wordmark fade-in to mask network).

Each step ends in a runnable, demoable state.

---

## Verification

- `pnpm dev` and inspect each route at 375px / 768px / 1440px against tokens.xyz screenshots side-by-side.
- Lighthouse (mobile) — accessibility ≥ 95, performance ≥ 85.
- `pnpm build` clean (TS + Vite).
- Storybook (`pnpm storybook`) — every new variant + state visible.
- Manual interaction matrix:
  - hover/focus/active on every button variant
  - tab switch on detail sidebar (Deposit/Withdraw/History) — capsule slides
  - time-pill switch on chart — chart re-strokes
  - mobile sticky CTA → sheet open/close
  - command palette ⌘K → vault search → navigate
  - keyboard-only: tab through Discover, focus rings visible everywhere
  - `prefers-reduced-motion: reduce` — no transforms, fades only
- Compare numeric rendering: every $/%/count uses MonoNumber; nothing in proportional sans.
- Color audit: zero `#FFFFFF` page backgrounds; zero pure `#000` text (use `--ink`).
- Accent restraint audit: count Cobalt usage per page — should be ≤ 4 distinct surfaces (focus ring + chart + 1 hero numeric + 1 CTA hover halo). If more, cut.

---

## Out of Scope

- New product features (no new vault types, no governance, no claims, no leaderboard).
- Backend / Solana program changes.
- Privy modal internals beyond theme prop.
- Email / notifications / settings UI deep dives (Settings page gets token+nav refresh only, not full restructure).
- Editorial illustrations (placeholder slots only — pitch with what we have).
- Marketing site / docs.
- Dark mode (deferred — light only per decision).

---

## Further Notes

- **Skill to invoke during implementation**: `frontend-design:frontend-design` — directly addresses "AI-slop avoidance" and forces conceptual commitment, exactly what this PRD requires.
- **Pre-implementation visual capture**: get Chrome installed via `npx playwright install chrome` so frontend-design can pull live tokens.xyz references at all 3 breakpoints. Otherwise we work from your screenshots + my reads.
- **Pitch storyboard suggestion**: open with `/fund/$id` (chart loads on stage = visceral). Then `/` Discover. Then `/portfolio`. Auth is supporting cast.
- **Future-proofing not done now**: dark mode tokens defined but commented out in `:root`; theme switching deferred.
- **frontend-design ↔ Figma**: if investors ask for design-deliverables, the Code-to-Canvas integration can mirror this into Figma post-pitch.

---

## Unresolved questions

1. ~~Accent~~ — locked to **Cobalt #024CC7**.
2. Wordmark — keep `instinct` lowercase + period, or different lockup?
3. Composition data: real underlying tokens available now, or mock for pitch?
4. Pitch date — drives motion-pass depth.
5. Phantom-style "approval" deposit flow w/ Privy, or simulated for demo?
6. Browser: install Chrome now (option A) or defer to execution (option C)?
7. Ticker symbol convention: `$INSTNCT-MAG7` or `$IMAG7` or no `$`?
8. Storybook scope: every new variant, or just primitives (button/card/pill/mono-number)?
9. ⌘K command palette — P0 or P1?
10. Onboarding "Welcome to instinct." moment — keep, or skip and route straight to Discover post-connect?
