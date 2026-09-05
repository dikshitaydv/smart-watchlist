import { generateSummary } from '../utils/summaryGenerator';
import { Router, Response } from 'express';
import { supabase } from '../supabaseClient';
import { requireAuth, AuthedRequest } from '../middleware/requireAuth';
import { computeAttentionScore, classifyPriority, classifyCategory } from '../utils/attentionScore';

const router = Router();

// GET /api/watchlists/:id/changes — read-only diff vs last-seen snapshot
router.get('/:id/changes', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const apiKey = process.env.FINNHUB_API_KEY;

  const { data: watchlist, error: wlError } = await supabase
    .from('watchlists')
    .select('*, watchlist_symbols(*)')
    .eq('id', id)
    .eq('user_id', req.userId)
    .single();

  if (wlError || !watchlist) {
    return res.status(404).json({ error: 'Watchlist not found' });
  }

  const symbols: string[] = watchlist.watchlist_symbols.map((s: any) => s.symbol);

  if (symbols.length === 0) {
    return res.json({ watchlistId: id, name: watchlist.name, stocks: [] });
  }

  // Get last-seen snapshots for this user for these symbols
  const { data: snapshots } = await supabase
    .from('price_snapshots')
    .select('*')
    .eq('user_id', req.userId)
    .in('symbol', symbols);

  const snapshotMap = new Map((snapshots || []).map((s) => [s.symbol, s]));

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        const snapshot = snapshotMap.get(symbol);
        // Fire-and-forget: log this price point for sparkline history
        supabase.from('price_history').insert({ symbol, price: data.c }).then(() => {});

        const scoreResult = computeAttentionScore({
          currentPrice: data.c,
          lastSeenPrice: snapshot ? snapshot.last_seen_price : null,
          dayHigh: data.h,
          dayLow: data.l,
          previousClose: data.pc,
        });

        const category = classifyCategory({
          percentChangeSinceLastSeen: scoreResult.percentChangeSinceLastSeen,
          dayVolatilityPercent: scoreResult.dayVolatilityPercent,
          currentPrice: data.c,
          dayHigh: data.h,
          dayLow: data.l,
        });

        return {
          symbol,
          currentPrice: data.c,
          attentionScore: scoreResult.attentionScore,
          priority: classifyPriority(scoreResult.attentionScore),
          category,
          fetchedAt: new Date().toISOString(),
          quoteTimestamp: data.t ? new Date(data.t * 1000).toISOString() : null,
        };
      } catch {
        return { symbol, error: 'Failed to fetch price' };
      }
    })
  );

  // Rank by attention score, highest first
  results.sort((a: any, b: any) => (b.attentionScore || 0) - (a.attentionScore || 0));

  res.json({ watchlistId: id, name: watchlist.name, stocks: results });
});

// GET /api/watchlists/:id/recap — same as /changes but with natural-language summaries
router.get('/:id/recap', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const apiKey = process.env.FINNHUB_API_KEY;

  const { data: watchlist, error: wlError } = await supabase
    .from('watchlists')
    .select('*, watchlist_symbols(*)')
    .eq('id', id)
    .eq('user_id', req.userId)
    .single();

  if (wlError || !watchlist) {
    return res.status(404).json({ error: 'Watchlist not found' });
  }

  const symbols: string[] = watchlist.watchlist_symbols.map((s: any) => s.symbol);

  if (symbols.length === 0) {
    return res.json({ watchlistId: id, name: watchlist.name, stocks: [] });
  }

  const { data: snapshots } = await supabase
    .from('price_snapshots')
    .select('*')
    .eq('user_id', req.userId)
    .in('symbol', symbols);

  const snapshotMap = new Map((snapshots || []).map((s) => [s.symbol, s]));

  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        const snapshot = snapshotMap.get(symbol);

        // Fire-and-forget: log this price point for sparkline history
        supabase.from('price_history').insert({ symbol, price: data.c }).then(() => {});

        const scoreResult = computeAttentionScore({
          currentPrice: data.c,
          lastSeenPrice: snapshot ? snapshot.last_seen_price : null,
          dayHigh: data.h,
          dayLow: data.l,
          previousClose: data.pc,
        });

        const summary = generateSummary({
          symbol,
          currentPrice: data.c,
          percentChangeSinceLastSeen: scoreResult.percentChangeSinceLastSeen,
          dayVolatilityPercent: scoreResult.dayVolatilityPercent,
          attentionScore: scoreResult.attentionScore,
          reasons: scoreResult.reasons,
        });

        const category = classifyCategory({
          percentChangeSinceLastSeen: scoreResult.percentChangeSinceLastSeen,
          dayVolatilityPercent: scoreResult.dayVolatilityPercent,
          currentPrice: data.c,
          dayHigh: data.h,
          dayLow: data.l,
        });

        return {
          symbol,
          currentPrice: data.c,
          attentionScore: scoreResult.attentionScore,
          priority: classifyPriority(scoreResult.attentionScore),
          category,
          summary,
          fetchedAt: new Date().toISOString(),
          quoteTimestamp: data.t ? new Date(data.t * 1000).toISOString() : null,
        };
      } catch {
        return { symbol, error: 'Failed to fetch price' };
      }
    })
  );

  results.sort((a: any, b: any) => (b.attentionScore || 0) - (a.attentionScore || 0));

  res.json({ watchlistId: id, name: watchlist.name, stocks: results });
});

// POST /api/watchlists/:id/mark-seen — update snapshots to current state
router.post('/:id/mark-seen', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const apiKey = process.env.FINNHUB_API_KEY;

  const { data: watchlist, error: wlError } = await supabase
    .from('watchlists')
    .select('*, watchlist_symbols(*)')
    .eq('id', id)
    .eq('user_id', req.userId)
    .single();

  if (wlError || !watchlist) {
    return res.status(404).json({ error: 'Watchlist not found' });
  }

  const symbols: string[] = watchlist.watchlist_symbols.map((s: any) => s.symbol);

  await Promise.all(
    symbols.map(async (symbol) => {
      const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      await supabase.from('price_snapshots').upsert(
        {
          user_id: req.userId,
          symbol,
          last_seen_price: data.c,
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,symbol' }
      );
    })
  );

  res.json({ status: 'ok', updated: symbols.length });
});

export default router;