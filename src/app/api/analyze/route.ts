import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { Review } from "@/types/review";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Gemini retires model ids over time (e.g. gemini-2.5-flash now returns
 * 404 NOT_FOUND). Try the configured model first, then fall back through
 * cheaper/older flash models that are still served, so a single retired or
 * overloaded model does not break the dashboard.
 */
const MODEL_CANDIDATES = Array.from(
  new Set(
    [
      process.env.GEMINI_MODEL,
      "gemini-3.8-flash",
      "gemini-3.6-flash",
      "gemini-3.5-flash",
    ].filter((model): model is string => Boolean(model && model.trim()))
  )
);

const RETRYABLE_PATTERN =
  /RESOURCE_EXHAUSTED|UNAVAILABLE|NOT_FOUND|INTERNAL|DEADLINE_EXCEEDED|"code":\s*(404|429|500|502|503|504)|high demand|no longer available|overloaded|timed? ?out/i;

/** Gemini SDK errors often carry a JSON string as the message; unwrap it. */
function describeError(error: unknown): string {
  if (!(error instanceof Error)) return "AI analysis failed.";
  const raw = error.message || "";
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string; status?: string; code?: number };
      message?: string;
    };
    const inner = parsed?.error ?? parsed;
    if (inner?.message) return String(inner.message);
  } catch {
    /* message was not JSON — use it as-is */
  }
  return raw || "AI analysis failed.";
}

function parseInsights(text: string) {
  const cleaned = text
    .replace(/^\s*```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const json = start !== -1 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(json);
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini is not configured. Add GEMINI_API_KEY to .env.local." },
      { status: 503 }
    );
  }

  let body: { reviews?: Review[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const reviews: Review[] = Array.isArray(body.reviews) ? body.reviews.slice(0, 100) : [];
  if (!reviews.length) {
    return NextResponse.json({ error: "There are no reviews to analyse." }, { status: 400 });
  }

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
Review data: ${JSON.stringify(
    reviews.map((r) => ({
      property: r.property,
      rating: r.rating,
      sentiment: r.sentiment,
      category: r.category,
      text: r.review_text,
    }))
  )}`;

  let lastError = "AI analysis failed.";
  let lastStatus = 502;

  for (const model of MODEL_CANDIDATES) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { timeout: 45000 },
      });

      const result = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { responseMimeType: "application/json", temperature: 0.2 },
      });

      const raw = result.text?.trim();
      if (!raw) {
        lastError = "The AI model returned an empty response.";
        lastStatus = 502;
        continue;
      }

      const insights = parseInsights(raw);
      return NextResponse.json({ insights, model });
    } catch (error) {
      const message = describeError(error);
      const retryable = RETRYABLE_PATTERN.test(`${message} ${error instanceof Error ? error.message : ""}`);

      lastError = message;
      lastStatus = /API key|PERMISSION_DENIED|UNAUTHENTICATED|INVALID_ARGUMENT|"code":\s*(400|401|403)/i.test(
        `${message} ${error instanceof Error ? error.message : ""}`
      )
        ? 502
        : 503;

      if (!retryable) break;
    }
  }

  return NextResponse.json({ error: lastError }, { status: lastStatus });
}
