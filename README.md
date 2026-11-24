# Azzurro Review Insights

A Next.js MVP for hotel review analytics across four properties, with CSV import, Supabase persistence, Recharts visualisations and Gemini-powered operational insights.

## Important data note

The included review records are fictional demonstration data. They are not Booking.com reviews and must not be represented as actual Azzurro guest feedback. Use only review exports or feeds that the employer provides or authorises. The monthly trend chart is also explicitly illustrative until historical month-level data is available.

## Requirements

- Node.js 20.9+ (recommended)
- npm
- Supabase project (optional for local demo mode)
- Google AI Studio API key (optional until using AI analysis)

## 1. Install

```bash
npm install
cp .env.example .env.local
npm run dev
npm run build
npm run start
git status --ignored


npm install
