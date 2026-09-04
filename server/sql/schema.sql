-- Watchlists: a user can have multiple named lists
create table watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null default 'My Watchlist',
  created_at timestamptz not null default now()
);

-- Which symbols belong to which watchlist
create table watchlist_symbols (
  id uuid primary key default gen_random_uuid(),
  watchlist_id uuid not null references watchlists(id) on delete cascade,
  symbol text not null,
  added_at timestamptz not null default now(),
  unique(watchlist_id, symbol)
);

-- "Last seen" state per user per symbol — powers the "what changed" diff
create table price_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  symbol text not null,
  last_seen_price numeric not null,
  last_seen_at timestamptz not null default now(),
  last_seen_volume bigint,
  attention_score numeric default 0,
  unique(user_id, symbol)
);

-- Rolling price/volume log per symbol — used for volatility baseline + Attention Score
create table price_history (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  price numeric not null,
  volume bigint,
  recorded_at timestamptz not null default now()
);

create index idx_price_history_symbol_time on price_history(symbol, recorded_at desc);