interface ChangeStock {
  symbol: string;
  currentPrice: number;
  attentionScore: number;
  summary: string;
}

interface Props {
  stock: ChangeStock;
  rank: number;
}

export default function RecapCard({ stock, rank }: Props) {
  const scoreColor =
    stock.attentionScore >= 70 ? '#ef4444' : stock.attentionScore >= 40 ? '#f59e0b' : '#6b7280';

  return (
    <div
      style={{
        background: '#161616',
        border: '1px solid #2a2a2a',
        borderRadius: 14,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: scoreColor,
        }}
      />

      <div style={{ fontSize: 13, color: '#666', width: 24 }}>#{rank}</div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{stock.symbol}</span>
          <span style={{ fontSize: 16, color: '#ccc' }}>${stock.currentPrice?.toFixed(2)}</span>
        </div>
        <div style={{ fontSize: 14, color: '#bbb', lineHeight: 1.5 }}>{stock.summary}</div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: `2px solid ${scoreColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            color: scoreColor,
            fontSize: 15,
          }}
        >
          {stock.attentionScore}
        </div>
      </div>
    </div>
  );
}