import { NextResponse } from "next/server";
import { demoReviews } from "@/lib/demo-data";
import { hasSupabase, supabase } from "@/lib/supabase";
import {
  detectRatingScale,
  sentimentForRating,
  toTenPointScale,
  type RatingScale,
} from "@/lib/rating";
import type { Review } from "@/types/review";

export const dynamic = "force-dynamic";

type ImportBody = {
  reviews?: Review[];
  /** Force a source scale, or leave unset to auto-detect from the batch. */
  rating_scale?: "auto" | "5" | "10" | 5 | 10;
  /** Validate and normalise without writing to the database. */
  dryRun?: boolean;
};

function resolveScale(override: ImportBody["rating_scale"], ratings: number[]): RatingScale {
  if (override === "5" || override === 5) return 5;
  if (override === "10" || override === 10) return 10;
  return detectRatingScale(ratings);
}

export async function GET() {
  if (!hasSupabase || !supabase) {
    return NextResponse.json({ reviews: demoReviews, mode: "demo" });
  }
  const { data, error } = await supabase.from("reviews").select("*").order("review_date", { ascending: false }).limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reviews: data || [], mode: "supabase" });
}

export async function POST(request: Request) {
  try {
    const body: ImportBody = await request.json();
    const rows: Review[] = Array.isArray(body.reviews) ? body.reviews : [];
    if (!rows.length) return NextResponse.json({ error: "No reviews supplied." }, { status: 400 });
    if (rows.length > 1000) return NextResponse.json({ error: "Maximum 1,000 reviews per import." }, { status: 400 });

    const scale = resolveScale(
      body.rating_scale,
      rows.map((r) => Number(r.rating))
    );

    const clean = rows.map((r, i) => {
      const rating = toTenPointScale(Number(r.rating), scale);
      return {
        id: r.id || `import-${Date.now()}-${i}`,
        property: String(r.property || "").trim(),
        guest_name: String(r.guest_name || "Guest").slice(0, 100),
        review_date: r.review_date || new Date().toISOString().slice(0, 10),
        rating,
        title: String(r.title || "").slice(0, 200),
        review_text: String(r.review_text || "").slice(0, 5000),
        sentiment: r.sentiment || sentimentForRating(rating),
        category: String(r.category || "Other").slice(0, 80),
        source: String(r.source || "Imported").slice(0, 80),
      };
    });

    if (clean.some((r) => !r.property || !Number.isFinite(r.rating) || r.rating < 0 || r.rating > 10 || !r.review_text)) {
      return NextResponse.json({ error: "Each row needs a property, review_text and a rating from 0 to 10." }, { status: 400 });
    }

    const scaleInfo = { scale, scaled: scale === 5 };

    if (body.dryRun) {
      return NextResponse.json({
        dryRun: true,
        wouldImport: clean.length,
        ...scaleInfo,
        preview: clean.slice(0, 5),
      });
    }

    if (!hasSupabase || !supabase) {
      return NextResponse.json(
        { error: "Supabase is not configured. Add your Supabase environment variables before importing persistent data." },
        { status: 503 }
      );
    }

    const { data, error } = await supabase.from("reviews").insert(clean).select();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ imported: data?.length || clean.length, ...scaleInfo });
  } catch {
    return NextResponse.json({ error: "Invalid import request." }, { status: 400 });
  }
}
