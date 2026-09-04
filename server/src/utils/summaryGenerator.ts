interface SummaryInput {
  symbol: string;
  currentPrice: number;
  percentChangeSinceLastSeen: number | null;
  dayVolatilityPercent: number;
  attentionScore: number;
  reasons: string[];
}

// Rule-based natural language generator.
// Designed so this can later be swapped for an LLM call with zero
// changes to the frontend — the output shape stays { symbol, summary }.
export function generateSummary(input: SummaryInput): string {
  const { symbol, percentChangeSinceLastSeen, dayVolatilityPercent, attentionScore } = input;

  if (percentChangeSinceLastSeen === null) {
    return `${symbol} is new to your watchlist — we'll start tracking changes from here.`;
  }

  const absChange = Math.abs(percentChangeSinceLastSeen);
  const direction = percentChangeSinceLastSeen >= 0 ? 'climbed' : 'fell';

  let intensity = 'ticked';
  if (absChange >= 10) intensity = percentChangeSinceLastSeen >= 0 ? 'surged' : 'plunged';
  else if (absChange >= 5) intensity = percentChangeSinceLastSeen >= 0 ? 'jumped' : 'dropped';
  else if (absChange >= 2) intensity = direction;

  let sentence = `${symbol} ${intensity} ${absChange.toFixed(1)}% since you last checked.`;

  if (dayVolatilityPercent >= 4) {
    sentence += ` It's been a volatile session, swinging ${dayVolatilityPercent.toFixed(1)}% between its high and low.`;
  }

  if (attentionScore >= 70) {
    sentence += ' This is worth a closer look.';
  } else if (attentionScore < 25) {
    sentence += ' Nothing urgent here.';
  }

  return sentence;
}