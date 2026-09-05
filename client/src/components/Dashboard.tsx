import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '../api';
import RecapCard from './RecapCard';

interface WatchlistSymbol {
  id: string;
  symbol: string;
}

interface Watchlist {
  id: string;
  name: string;
  watchlist_symbols: WatchlistSymbol[];
}

interface ChangeStock {
  symbol: string;
  currentPrice: number;
  attentionScore: number;
  priority: 'attention' | 'notable' | 'steady';
  category: string;
  summary: string;
  fetchedAt: string;
  quoteTimestamp: string | null;
}

const SECTIONS: { key: ChangeStock['priority']; title: string; hint: string }[] = [
  { key: 'attention', title: 'Needs your attention', hint: 'Meaningful moves since you last checked' },
  { key: 'notable', title: 'Worth a glance', hint: 'Some movement, nothing urgent' },
  { key: 'steady', title: 'Steady', hint: 'Little to no change' },
];

export default function Dashboard() {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [changes, setChanges] = useState<ChangeStock[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadWatchlists() {
    const data = await apiGet('/watchlists');
    setWatchlists(data);
    if (!selectedId && data.length > 0) setSelectedId(data[0].id);
  }

  useEffect(() => {
    loadWatchlists();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    loadChanges(selectedId);
    const interval = setInterval(() => loadChanges(selectedId), 30000);
    return () => clearInterval(interval);
  }, [selectedId, watchlists]);

  async function loadChanges(watchlistId: string) {
    setLoading(true);
    try {
      const data = await apiGet(`/watchlists/${watchlistId}/recap`);
      setChanges(data.stocks);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateList(e: React.FormEvent) {
    e.preventDefault();
    if (!newListName.trim()) return;
    const created = await apiPost('/watchlists', { name: newListName });
    setNewListName('');
    await loadWatchlists();
    setSelectedId(created.id);
  }

  async function handleDeleteList(id: string) {
    await apiDelete(`/watchlists/${id}`);
    if (selectedId === id) setSelectedId(null);
    await loadWatchlists();
  }

  async function handleAddSymbol(e: React.FormEvent) {
    e.preventDefault();
    if (!newSymbol.trim() || !selectedId) return;
    await apiPost(`/watchlists/${selectedId}/symbols`, { symbol: newSymbol });
    setNewSymbol('');
    await loadWatchlists();
  }

  async function handleMarkSeen() {
    if (!selectedId) return;
    await apiPost(`/watchlists/${selectedId}/mark-seen`);
    await loadChanges(selectedId);
  }

  const selectedList = watchlists.find((w) => w.id === selectedId);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{ width: 260, borderRight: '1px solid var(--border)', padding: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-muted)', margin: '0 0 12px' }}>
          Your watchlists
        </h3>
        {watchlists.map((w) => (
          <div
            key={w.id}
            onClick={() => setSelectedId(w.id)}
            style={{
              padding: '9px 11px',
              cursor: 'pointer',
              background: w.id === selectedId ? 'var(--surface-raised)' : 'transparent',
              borderRadius: 5,
              marginBottom: 3,
              fontSize: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>
              {w.name} <span style={{ color: 'var(--ink-muted)' }}>({w.watchlist_symbols.length})</span>
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete "${w.name}"?`)) handleDeleteList(w.id);
              }}
              style={{ fontSize: 12, color: 'var(--ink-muted)' }}
            >
              ✕
            </span>
          </div>
        ))}
        <form onSubmit={handleCreateList} style={{ marginTop: 18 }}>
          <input
            placeholder="New list name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              marginBottom: 6,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 5,
              color: 'var(--ink)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: 8,
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 5,
              color: '#0E1116',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Create list
          </button>
        </form>
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, padding: '36px 44px', maxWidth: 820 }}>
        {!selectedList ? (
          <p style={{ color: 'var(--ink-muted)' }}>Create a watchlist to get started.</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: 30, margin: 0 }}>
                {selectedList.name}
              </h1>
              <button
                onClick={handleMarkSeen}
                style={{
                  padding: '7px 14px',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: 5,
                  color: 'var(--ink-muted)',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Mark all as seen
              </button>
            </div>
            <p style={{ color: 'var(--ink-muted)', fontSize: 13, marginTop: 4, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--positive)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              Refreshing automatically
            </p>

            <form onSubmit={handleAddSymbol} style={{ marginBottom: 32, display: 'flex', gap: 8 }}>
              <input
                placeholder="Add a symbol, e.g. AAPL"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                style={{
                  flex: 1,
                  padding: 10,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 5,
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: 'var(--accent)',
                  border: 'none',
                  borderRadius: 5,
                  color: '#0E1116',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </form>

            {loading && changes.length === 0 && <p style={{ color: 'var(--ink-muted)' }}>Loading your stocks…</p>}

            {SECTIONS.map((section) => {
              const stocksInSection = changes.filter((s) => s.priority === section.key);
              if (stocksInSection.length === 0) return null;

              return (
                <div key={section.key} style={{ marginBottom: 32 }}>
                  <div style={{ marginBottom: 12 }}>
                    <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--ink)' }}>
                      {section.title}
                    </h2>
                    <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: '2px 0 0' }}>{section.hint}</p>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {stocksInSection.map((stock) => (
                      <RecapCard key={stock.symbol} stock={stock} />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}