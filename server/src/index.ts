import { requireAuth, AuthedRequest } from './middleware/requireAuth';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { supabase } from './supabaseClient';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Smart Watchlist server is running' });
});

app.get('/api/db-check', async (req, res) => {
  const { data, error } = await supabase.from('healthcheck').select('*').limit(1);

  if (error && !error.message.includes('Could not find the table')) {
    // PGRST205 just means "table doesn't exist" — that's fine, it proves we reached Supabase
    return res.status(500).json({ connected: false, error: error.message });
  }

  res.json({ connected: true, message: 'Successfully reached Supabase' });
});

app.get('/api/whoami', requireAuth, (req: AuthedRequest, res) => {
  res.json({ userId: req.userId });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});