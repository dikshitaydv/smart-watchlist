import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { apiGet } from '../api';

interface Props {
  symbol: string;
  color: string;
}

export default function Sparkline({ symbol, color }: Props) {
  const [points, setPoints] = useState<{ price: number }[]>([]);

  useEffect(() => {
    let cancelled = false;
    apiGet(`/prices/${symbol}/history`)
      .then((data) => {
        if (!cancelled) setPoints(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (points.length < 2) {
    return (
      <div style={{ width: 90, height: 32, fontSize: 10, color: 'var(--ink-muted)', display: 'flex', alignItems: 'center' }}>
        Building trend…
      </div>
    );
  }

  return (
    <div style={{ width: 90, height: 32 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points}>
          <Line type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}