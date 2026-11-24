import type { Review } from "@/types/review";

export function getAnalytics(reviews: Review[]) {
  const total = reviews.length;
  const average = total ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / total : 0;
  const count = (s: string) => reviews.filter(r => r.sentiment === s).length;
  const propertyStats = [...new Set(reviews.map(r => r.property))].map(property => {
    const rows = reviews.filter(r => r.property === property);
    return {
      property, reviews: rows.length,
      average: rows.length ? Number((rows.reduce((a, r) => a + Number(r.rating || 0), 0) / rows.length).toFixed(1)) : 0,
      negative: rows.filter(r => r.sentiment === "Negative").length
    };
  });
  const categoryMap = new Map<string, number>();
  reviews.forEach(r => categoryMap.set(r.category || "Other", (categoryMap.get(r.category || "Other") || 0) + 1));
  return {
    total, average: Number(average.toFixed(1)),
    positive: count("Positive"), neutral: count("Neutral"), negative: count("Negative"),
    positivePct: total ? Math.round(count("Positive") / total * 100) : 0,
    negativePct: total ? Math.round(count("Negative") / total * 100) : 0,
    propertyStats,
    categories: [...categoryMap.entries()].map(([category, count]) => ({ category, count })).sort((a,b) => b.count-a.count).slice(0,6)
  };
}
