# Conditional Markets — Three-Layer Architecture

## Layer 1: Chain Builder

Composable compound conditional markets. Users drag condition blocks together to create multi-leg bets with on-chain price discovery.

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  TRIGGER         │────▶│  CONDITION        │────▶│  CONDITION       │
│  Pelosi buys     │     │  AI regulation    │     │  NVDA > $200     │
│  NVDA            │     │  bill passes      │     │  within 30 days  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                                                     ┌────▼────┐
                                                     │  MARKET  │
                                                     │  YES/NO  │
                                                     │  $0.12   │
                                                     └─────────┘
```

- A single-block chain = a Polymarket-style binary bet
- A multi-block chain = a compound conditional market that prices correlation between events
- Anyone can compose, fork, or extend chains permissionlessly
- Condition blocks pull from external sources: Polymarket (cross-chain), Pyth price feeds, on-chain data, optimistic oracles
- Resolution flows left to right — if any condition fails, the entire chain resolves NO immediately

**The signal:** the gap between a chain's price and the naive product of individual event probabilities is the market's consensus on how correlated those events are. That correlation premium has never been tradeable before.

---

## Layer 2: Thesis Baskets

Curated portfolios of chains that represent a single narrative, strategy, or thesis — packaged as one investable position.

**"Pelosi Alpha" basket:**

```
[Pelosi buys NVDA]  → [NVDA > $200 in 30d]  → YES
[Pelosi buys GOOGL] → [GOOGL > $190 in 30d] → YES
[Pelosi buys AAPL]  → [AAPL > $250 in 30d]  → YES
[Pelosi buys MSFT]  → [MSFT > $500 in 30d]  → YES
```

**"Fed Dovish" basket:**

```
[Fed cuts rates] → [SOL > $300]      → YES
[Fed cuts rates] → [BTC > $120k]     → YES
[Fed cuts rates] → [NASDAQ > 20k]    → YES
[Fed cuts rates] → [DXY < 100]       → YES
```

**"AI Regulation" basket:**

```
[AI bill passes] → [NVDA > $200]                → YES
[AI bill passes] → [GOOGL > $190]               → YES
[AI bill passes] → [OpenAI IPO by Q4]           → YES
[AI bill passes] → [Compute costs drop 50%]     → YES
```

- Buy a basket = get diversified exposure to an entire thesis in one click
- Basket price = weighted average of underlying chain prices
- Baskets are created by anyone — power users, analysts, influencers
- Enables a leaderboard: which theses are the market pricing highest? Which basket creators have the best track record?

---

## Layer 3: Autopilot

AI-powered automation that generates chains, seeds liquidity, and manages baskets — making the platform reactive and self-sustaining.

**AI Market Maker**
- Decomposes any chain into component probabilities using Polymarket prices, Pyth feeds, and historical correlation data
- Computes fair value and seeds both sides of every chain from creation
- Humans trade against the AI when they disagree with its correlation estimate — that disagreement IS the price discovery

**AI Chain Generator**
- Watches news feeds, STOCK Act filings, macro events, on-chain activity
- Auto-generates relevant chains within seconds of a trigger event
- News breaks → chains exist → AI seeds liquidity → humans trade

**Basket Autopilot**
- User picks a thesis and deposits capital
- Protocol auto-allocates across all chains in the basket
- Auto-adds new chains as the AI detects relevant events (new Pelosi filing → new chain added)
- Auto-removes resolved chains and recycles capital into active ones
- Rebalances as conditions partially resolve

---

*Built on Solana. Liquidity on Meteora. Swaps routed via Jupiter. Event resolution via Polymarket (cross-chain), Pyth, and optimistic oracles.*
