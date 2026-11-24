-- Run this in Supabase SQL Editor.
create table if not exists public.reviews (
  id text primary key,
  property text not null,
  guest_name text not null default 'Guest',
  review_date date not null,
  rating numeric(3,1) not null check (rating >= 0 and rating <= 10),
  title text not null default '',
  review_text text not null,
  sentiment text not null check (sentiment in ('Positive','Neutral','Negative')),
  category text not null default 'Other',
  source text not null default 'Imported',
  created_at timestamptz not null default now()
);

create index if not exists reviews_property_idx on public.reviews(property);
create index if not exists reviews_date_idx on public.reviews(review_date desc);
create index if not exists reviews_sentiment_idx on public.reviews(sentiment);

-- This starter accesses Supabase from server routes using the service-role key.
-- Do NOT expose the service-role key to the browser.
-- For production, add authentication and appropriate Row Level Security policies.
alter table public.reviews enable row level security;
