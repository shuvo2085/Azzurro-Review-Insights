import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { Review } from "@/types/review";

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "Gemini is not configured. Add GEMINI_API_KEY to .env.local." }, { status: 503 });
  }
  try {
    const body = await request.json();
    const reviews: Review[] = Array.isArray(body.reviews) ? body.reviews.slice(0,100) : [];
    if (!reviews.length) return NextResponse.json({ error: "There are no reviews to analyse." }, { status: 400 });

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are an operations analyst for a hotel group. Analyse only the review data below.
Return valid JSON only with this exact shape:
{
 "summary": "2-3 sentence executive summary",
 "strengths": ["..."],
 "issues": [{"topic":"...", "severity":"High|Medium|Low", "evidence":"short evidence-based explanation"}],
 "actions": [{"priority":"High|Medium|Low", "action":"specific operational action", "owner":"suggested team"}],
 "property_observations": [{"property":"...", "observation":"..."}]
}
Do not invent facts, guest names, statistics, or causes. Distinguish observations from hypotheses. Use concise practical language.
Review data: ${JSON.stringify(reviews.map(r => ({property:r.property, rating:r.rating, sentiment:r.sentiment, category:r.category, text:r.review_text})))}`;

    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.2 }
    });
    const raw = result.text || "";
    const parsed = JSON.parse(raw.replace(/^```json\s*/i,"").replace(/```$/,"").trim());
    return NextResponse.json({ insights: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI analysis failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
