import Sparkline from './Sparkline';

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

interface Props {
  stock: ChangeStock;
}

const CATEGORY_LABELS: Record<string, string> = {
  'new': 'New',
  'big-move': 'Price move',
  'volatile': 'Volatile session',
  'level-watch': 'Level watch',
  'steady': 'Steady',
};

function timeAgo(isoString: string | null): string {
  if (!isoString) return 'unknown';
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function RecapCard({ stock }: Props) {
  const quoteAgeSeconds = stock.quoteTimestamp
    ? (Date.now() - new Date(stock.quoteTimestamp).getTime()) / 1000
    : Infinity;
  const isStale = quoteAgeSeconds > 300;

  const lineColor =
    stock.category === 'big-move' || stock.category === 'volatile'
      ? 'var(--negative)'
      : 'var(--positive)';

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '18px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--accent)',
              border: '1px solid var(--accent)',
              borderRadius: 3,
              padding: '2px 7px',
            }}
          >
            {CATEGORY_LABELS[stock.category] || stock.category}
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
            {stock.symbol}
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontVariantNumeric: 'tabular-nums', fontSize: 14, color: 'var(--ink-muted)' }}>
            ${stock.currentPrice?.toFixed(2)}
          </span>
        </div>

        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.4, margin: 0, color: 'var(--ink)' }}>
          {stock.summary}
        </p>

        <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: isStale ? 'var(--accent)' : 'var(--positive)',
              display: 'inline-block',
            }}
          />
          {isStale ? 'Delayed' : 'Live'}, updated {timeAgo(stock.quoteTimestamp)}
        </div>
      </div>

      <Sparkline symbol={stock.symbol} color={lineColor} />
    </div>
  );
}