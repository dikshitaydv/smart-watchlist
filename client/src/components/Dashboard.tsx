import { useEffect, useState } from 'react';
import { apiGet, apiPost, apiDelete } from '../api';

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
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: 240, borderRight: '1px solid #ddd', padding: 16 }}>
        <h3>Your Watchlists</h3>
        {watchlists.map((w) => (
          <div
            key={w.id}
            onClick={() => setSelectedId(w.id)}
            style={{
              padding: 8,
              cursor: 'pointer',
              background: w.id === selectedId ? '#eee' : 'transparent',
              borderRadius: 4,
              marginBottom: 4,
            }}
          >
            {w.name} ({w.watchlist_symbols.length})
          </div>
        ))}
        <form onSubmit={handleCreateList} style={{ marginTop: 16 }}>
          <input
            placeholder="New list name"
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            style={{ width: '100%', padding: 6, marginBottom: 6 }}
          />
          <button type="submit" style={{ width: '100%', padding: 6 }}>
            + Create List
          </button>
        </form>
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, padding: 24 }}>
        {!selectedList ? (
          <p>Create a watchlist to get started.</p>
        ) : (
          <>
            <h2>{selectedList.name}</h2>

            <form onSubmit={handleAddSymbol} style={{ marginBottom: 16 }}>
              <input
                placeholder="Add symbol (e.g. AAPL)"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                style={{ padding: 6, marginRight: 6 }}
              />
              <button type="submit" style={{ padding: 6 }}>
                Add
              </button>
              <button
                type="button"
                onClick={handleMarkSeen}
                style={{ padding: 6, marginLeft: 12 }}
              >
                Mark all as seen
              </button>
            </form>

            {loading && <p>Loading prices...</p>}

            <div style={{ display: 'grid', gap: 12 }}>
              {changes.map((stock) => {
                const symbolEntry = selectedList.watchlist_symbols.find(
                  (s) => s.symbol === stock.symbol
                );
                const changeColor =
                  stock.percentChangeSinceLastSeen === null
                    ? '#888'
                    : stock.percentChangeSinceLastSeen >= 0
                    ? 'green'
                    : 'red';

                return (
                  <div
                    key={stock.symbol}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: 8,
                      padding: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong>{stock.symbol}</strong> — ${stock.currentPrice?.toFixed(2)}
                      <div style={{ fontSize: 13, color: changeColor }}>
                        {stock.percentChangeSinceLastSeen !== null
                          ? `${stock.percentChangeSinceLastSeen.toFixed(2)}% since last seen`
                          : 'Not seen before'}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {stock.reasons.join(' · ')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: '#999' }}>Attention</div>
                      <div style={{ fontWeight: 'bold' }}>{stock.attentionScore}</div>
                      {symbolEntry && (
                        <button
                          onClick={() => handleRemoveSymbol(symbolEntry.id)}
                          style={{ fontSize: 11, marginTop: 4 }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}