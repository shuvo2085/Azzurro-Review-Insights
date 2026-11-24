export type Sentiment = "Positive" | "Neutral" | "Negative";
export type Review = {
  id: string;
  property: string;
  guest_name: string;
  review_date: string;
  rating: number;
  title: string;
  review_text: string;
  sentiment: Sentiment;
  category: string;
  source: string;
  is_demo?: boolean;
};
