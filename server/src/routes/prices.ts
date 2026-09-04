import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/requireAuth';

const router = Router();

router.get('/:symbol', requireAuth, async (req: Request, res: Response) => {
  const { symbol } = req.params;
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Finnhub API key not configured' });
  }

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol.toUpperCase()}&token=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    // Finnhub returns all zeros for an invalid/unknown symbol
    if (data.c === 0 && data.h === 0 && data.l === 0) {
      return res.status(404).json({ error: `No data found for symbol ${symbol}` });
    }

    res.json({
      symbol: symbol.toUpperCase(),
      currentPrice: data.c,
      change: data.d,
      percentChange: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      timestamp: data.t,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch price data' });
  }
});

export default router;