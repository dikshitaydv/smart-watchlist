export interface AttentionInput {
  currentPrice: number;
  lastSeenPrice: number | null;
  dayHigh: number;
  dayLow: number;
  previousClose: number;
}

export interface AttentionResult {
  percentChangeSinceLastSeen: number | null;
  dayVolatilityPercent: number;
  attentionScore: number;
  reasons: string[];
}

// Combines "change since you last looked" with "how volatile is today's range"
// into one 0-100 score, plus human-readable reasons for the recap card.
export function computeAttentionScore(input: AttentionInput): AttentionResult {
  const { currentPrice, lastSeenPrice, dayHigh, dayLow, previousClose } = input;
  const reasons: string[] = [];

  const percentChangeSinceLastSeen =
    lastSeenPrice !== null && lastSeenPrice !== 0
      ? ((currentPrice - lastSeenPrice) / lastSeenPrice) * 100
      : null;

  const dayVolatilityPercent =
    previousClose !== 0 ? ((dayHigh - dayLow) / previousClose) * 100 : 0;

  let score = 0;

  if (percentChangeSinceLastSeen !== null) {
    const absChange = Math.abs(percentChangeSinceLastSeen);
    score += Math.min(absChange * 10, 60); // up to 60 points for magnitude of change
    if (absChange >= 3) {
      reasons.push(
        `${percentChangeSinceLastSeen > 0 ? 'Up' : 'Down'} ${absChange.toFixed(1)}% since you last checked`
      );
    }
  } else {
    reasons.push('First time tracking this stock');
    score += 20; // baseline curiosity score for new symbols
  }

  if (dayVolatilityPercent >= 3) {
    score += Math.min(dayVolatilityPercent * 5, 25);
    reasons.push(`Wide trading range today (${dayVolatilityPercent.toFixed(1)}%)`);
  }

  if (currentPrice >= dayHigh * 0.995) {
    score += 10;
    reasons.push("Near today's high");
  } else if (currentPrice <= dayLow * 1.005) {
    score += 10;
    reasons.push("Near today's low");
  }

  return {
    percentChangeSinceLastSeen,
    dayVolatilityPercent,
    attentionScore: Math.min(Math.round(score), 100),
    reasons,
  };
}