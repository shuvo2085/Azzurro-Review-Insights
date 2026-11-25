export type RatingScale = 5 | 10;

/**
 * Reviews arrive from several sources with different scales. Booking-style
 * exports are usually 0-10, while most consumer sites (TripAdvisor, Google,
 * many PMS exports) use a 5-star scale. A batch whose highest score never
 * exceeds 5 is treated as 5-star so it can be stored on the 0-10 scale the
 * dashboard renders against.
 */
export function detectRatingScale(ratings: number[]): RatingScale {
  const valid = ratings.filter((r) => Number.isFinite(r));
  if (!valid.length) return 10;
  return Math.max(...valid) <= 5 ? 5 : 10;
}

/** Convert a rating from the detected scale onto the canonical 0-10 scale. */
export function toTenPointScale(rating: number, scale: RatingScale): number {
  const scaled = scale === 5 ? rating * 2 : rating;
  return Math.min(10, Math.max(0, Math.round(scaled * 10) / 10));
}

/** Sentiment derived from a 0-10 rating, used when the source has no label. */
export function sentimentForRating(rating: number): "Positive" | "Neutral" | "Negative" {
  if (rating >= 8) return "Positive";
  if (rating >= 6) return "Neutral";
  return "Negative";
}
