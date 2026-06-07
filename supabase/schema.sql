-- Helix Signal — Supabase schema
-- Run this in the Supabase SQL editor (or via the CLI) to provision the backend.

create table if not exists public.signals (
  id              text primary key,
  type            text not null check (type in ('vc','mna','cohort','report','event')),
  title_en        text not null,
  title_zh        text not null,
  summary_en      text not null default '',
  summary_zh      text not null default '',
  org             text,
  target          text,
  amount_usd      bigint,
  amount_display  text,
  date            date not null,
  region          text not null default 'global',
  topics          text[] not null default '{}',
  source_url      text,
  source_id       text,
  importance      int not null default 3 check (importance between 1 and 5),
  format          text check (format in ('offline','online')),
  language        text check (language in ('en','zh','both')),
  ai_digest_en    text,
  ai_digest_zh    text,
  created_at      timestamptz not null default now()
);

create index if not exists signals_date_idx on public.signals (date desc);
create index if not exists signals_type_idx on public.signals (type);
create index if not exists signals_region_idx on public.signals (region);

-- Row Level Security: public read, writes only via service role (ingestion/admin).
alter table public.signals enable row level security;

drop policy if exists "public read" on public.signals;
create policy "public read" on public.signals
  for select using (true);

-- (Service role bypasses RLS, so no insert/update policy is needed for ingestion.)

-- Optional: persisted user preferences (if you add auth later).
create table if not exists public.user_prefs (
  user_id     uuid primary key,
  prefs       jsonb not null default '{}',
  updated_at  timestamptz not null default now()
);
alter table public.user_prefs enable row level security;
drop policy if exists "own prefs" on public.user_prefs;
create policy "own prefs" on public.user_prefs
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
