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
  lastSeenPrice: number | null;
  percentChangeSinceLastSeen: number | null;
  attentionScore: number;
  reasons: string[];
}

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
    if (selectedId) loadChanges(selectedId);
  }, [selectedId, watchlists]);

  async function loadChanges(watchlistId: string) {
    setLoading(true);
    try {
      const data = await apiGet(`/watchlists/${watchlistId}/changes`);
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

  async function handleAddSymbol(e: React.FormEvent) {
    e.preventDefault();
    if (!newSymbol.trim() || !selectedId) return;
    await apiPost(`/watchlists/${selectedId}/symbols`, { symbol: newSymbol });
    setNewSymbol('');
    await loadWatchlists();
  }

  async function handleRemoveSymbol(symbolId: string) {
    if (!selectedId) return;
    await apiDelete(`/watchlists/${selectedId}/symbols/${symbolId}`);
    await loadWatchlists();
  }

  async function handleMarkSeen() {
    if (!selectedId) return;
    await apiPost(`/watchlists/${selectedId}/mark-seen`);
    await loadChanges(selectedId);
  }

  const selectedList = watchlists.find((w) => w.id === selectedId);

    return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0a', color: '#fff' }}>
      {/* Sidebar */}
      <div style={{ width: 260, borderRight: '1px solid #222', padding: 20 }}>
        <h3 style={{ fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>
          Your Watchlists
        </h3>
        <div style={{ marginTop: 12 }}>
                    {watchlists.map((w) => (
            <div
              key={w.id}
              onClick={() => setSelectedId(w.id)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                background: w.id === selectedId ? '#1f1f1f' : 'transparent',
                borderRadius: 8,
                marginBottom: 4,
                fontSize: 14,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>
                {w.name} <span style={{ color: '#666' }}>({w.watchlist_symbols.length})</span>
              </span>
              <span
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${w.name}"?`)) {
                    await apiDelete(`/watchlists/${w.id}`);
                    if (selectedId === w.id) setSelectedId(null);
                    await loadWatchlists();
                  }
                }}
                style={{ fontSize: 12, color: '#555' }}
              >
                ✕
              </span>
            </div>
          ))}
        </div>
        <form onSubmit={handleCreateList} style={{ marginTop: 20 }}>
          <input
            placeholder="New list name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            style={{
              width: '100%',
              padding: 8,
              marginBottom: 6,
              background: '#161616',
              border: '1px solid #2a2a2a',
              borderRadius: 6,
              color: '#fff',
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: 8,
              background: '#2563eb',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            + Create List
          </button>
        </form>
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, padding: '32px 40px', maxWidth: 800 }}>
        {!selectedList ? (
          <p style={{ color: '#888' }}>Create a watchlist to get started.</p>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <h2 style={{ margin: 0 }}>{selectedList.name}</h2>
              <button
                onClick={handleMarkSeen}
                style={{
                  padding: '8px 14px',
                  background: '#161616',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  color: '#ccc',
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                Mark all as seen
              </button>
            </div>
            <p style={{ color: '#666', fontSize: 13, marginTop: 0, marginBottom: 20 }}>
              Ranked by what deserves your attention right now
            </p>

            <form onSubmit={handleAddSymbol} style={{ marginBottom: 24, display: 'flex', gap: 8 }}>
              <input
                placeholder="Add symbol (e.g. AAPL)"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                style={{
                  flex: 1,
                  padding: 10,
                  background: '#161616',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  color: '#fff',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 18px',
                  background: '#2563eb',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </form>

            {loading && <p style={{ color: '#888' }}>Loading prices...</p>}

            <div style={{ display: 'grid', gap: 10 }}>
              {changes.map((stock, i) => (
                <div key={stock.symbol} style={{ position: 'relative' }}>
                  <RecapCard stock={stock} rank={i + 1} />
                  {(() => {
                    const symbolEntry = selectedList.watchlist_symbols.find(
                      (s) => s.symbol === stock.symbol
                    );
                    return symbolEntry ? (
                      <button
                        onClick={() => handleRemoveSymbol(symbolEntry.id)}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          fontSize: 11,
                          background: 'transparent',
                          border: 'none',
                          color: '#555',
                          cursor: 'pointer',
                        }}
                      >
                        ✕ remove
                      </button>
                    ) : null;
                  })()}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}