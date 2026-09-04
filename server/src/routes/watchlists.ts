import { Router, Response } from 'express';
import { supabase } from '../supabaseClient';
import { requireAuth, AuthedRequest } from '../middleware/requireAuth';

const router = Router();

// Create a new watchlist
router.post('/', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { name } = req.body;

  const { data, error } = await supabase
    .from('watchlists')
    .insert({ user_id: req.userId, name: name || 'My Watchlist' })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Get all watchlists for the logged-in user, with their symbols
router.get('/', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { data: watchlists, error } = await supabase
    .from('watchlists')
    .select('*, watchlist_symbols(*)')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json(watchlists);
});

// Delete a watchlist (only if it belongs to the logged-in user)
router.delete('/:id', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('watchlists')
    .delete()
    .eq('id', id)
    .eq('user_id', req.userId);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// Add a symbol to a watchlist
router.post('/:id/symbols', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id } = req.params;
  const { symbol } = req.body;

  if (!symbol) return res.status(400).json({ error: 'Symbol is required' });

  // Confirm this watchlist belongs to the logged-in user before adding to it
  const { data: watchlist, error: ownerError } = await supabase
    .from('watchlists')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.userId)
    .single();

  if (ownerError || !watchlist) {
    return res.status(404).json({ error: 'Watchlist not found' });
  }

  const { data, error } = await supabase
    .from('watchlist_symbols')
    .insert({ watchlist_id: id, symbol: symbol.toUpperCase() })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Remove a symbol from a watchlist
router.delete('/:id/symbols/:symbolId', requireAuth, async (req: AuthedRequest, res: Response) => {
  const { id, symbolId } = req.params;

  // Confirm ownership first
  const { data: watchlist, error: ownerError } = await supabase
    .from('watchlists')
    .select('id')
    .eq('id', id)
    .eq('user_id', req.userId)
    .single();

  if (ownerError || !watchlist) {
    return res.status(404).json({ error: 'Watchlist not found' });
  }

  const { error } = await supabase
    .from('watchlist_symbols')
    .delete()
    .eq('id', symbolId)
    .eq('watchlist_id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

export default router;