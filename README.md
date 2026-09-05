# Market Wire — Smart Market Watchlist

A watchlist that doesn't just show you prices — it tells you what actually changed since you last looked, and how urgently it deserves your attention.

**Live app:** https://smart-watchlist-gules.vercel.app
**Backend API:** https://smart-watchlist-27qm.onrender.com/api/health

---

## What it does

- Create and manage multiple watchlists
- Add/remove stock symbols with live prices (via Finnhub)
- On return, stocks are grouped into three plain-language sections — **Needs your attention**, **Worth a glance**, **Steady** — based on an Attention Score computed from price movement since your last visit, intraday volatility, and proximity to daily highs/lows
- Each stock gets a natural-language summary ("AAPL climbed 2.1% since you last checked") instead of a raw number
- Live sparkline trend charts, built from price history recorded during your session
- Visible freshness indicators — flags when a quote is delayed rather than pretending it's live
- Auto-refreshes every 30 seconds

## Tech stack

- **Frontend:** React + TypeScript, Vite, Recharts, Lucide icons — deployed on Vercel
- **Backend:** Node.js + Express + TypeScript — deployed on Render
- **Database/Auth:** Supabase (Postgres + email/password auth)
- **Market data:** Finnhub (free tier, US equities)

## Architecture

```
Browser (React)
  │  JWT in Authorization header
  ▼
Express API  ──▶  Supabase (Postgres: watchlists, symbols, snapshots, price history)
  │
  ▼
Finnhub API (live quotes)
```

Live-diffing works by storing a `price_snapshots` row per (user, symbol) — the price as of the user's last visit. On each load, the current Finnhub quote is compared against that snapshot to compute the change; a separate "mark as seen" action updates the snapshot. This is what makes "return later and see what changed" accurate even if a user checks the app multiple times a day, rather than naively comparing to yesterday's close.

## Setup instructions

### Prerequisites
- Node.js 20+ and npm
- A free [Supabase](https://supabase.com) project
- A free [Finnhub](https://finnhub.io) API key

### 1. Clone the repo
```bash
git clone https://github.com/dikshitaydv/smart-watchlist.git
cd smart-watchlist
```

### 2. Set up the database
In your Supabase project's SQL editor, run the schema in `server/sql/schema.sql`.

### 3. Backend
```bash
cd server
npm install
```
Create a `.env` file in `server/`:
```
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_supabase_connection_string
FINNHUB_API_KEY=your_finnhub_api_key
```
```bash
npm run dev
```
Backend runs at `http://localhost:5000`.

### 4. Frontend
```bash
cd ../client
npm install
```
Create a `.env` file in `client/`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000/api
```
```bash
npm run dev
```
Frontend runs at `http://localhost:5173`.

## Design decisions

**What counts as a meaningful change?** Not a flat % threshold. The Attention Score combines (1) % change since the user's own last-seen snapshot, (2) intraday volatility relative to the stock's own daily range, and (3) proximity to the day's high/low. A 2% move in a normally flat stock is scored differently than 2% in a stock that swings 5% daily.

**What information to surface?** A single plain-language sentence per stock plus a category tag (Price move / Volatile session / Level watch / New), grouped into three priority tiers — not a dense data table. The goal is a person can scan it in seconds.

**State across sessions/devices:** All state (watchlists, symbols, last-seen snapshots) lives in Postgres via Supabase, keyed to the authenticated user — not localStorage — so it's consistent across devices and browser sessions.

**Handling stale/delayed/conflicting data:** Every quote carries a visible freshness indicator (Live vs. Delayed) based on the age of the exchange timestamp, not just when our server fetched it. We show honestly, rather than hide, when data is outside real-time (e.g. markets closed).

**Scaling for more users/symbols:** The current polling-based refresh (30s client-side interval) is a deliberate simplification for a 2-day build. It's designed to swap cleanly for a push-based model (WebSocket/SSE + Redis pub-sub, with Kafka for durability) without changing the frontend's data contract — the recap endpoint's shape stays the same either way.

**Simple vs. complex tradeoffs:** Row-level ownership is currently enforced manually in the API layer rather than via Supabase RLS policies, to move faster during the build; this is flagged as the next hardening step before production use. Recap summaries are rule-based (not an LLM call) to avoid external API cost/latency risk during a live demo — the summary generator is structured so it could be swapped for an LLM call with no frontend changes.

## Known limitations

- Free-tier Finnhub covers US equities only (not NSE/BSE) — noted as a deliberate scope cut for reliability within the timeline
- Render's free tier spins down when idle; first request after inactivity may take 20-30 seconds
- Sparklines populate from price history recorded during actual usage, so they start empty for brand-new symbols