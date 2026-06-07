# Helix Signal · 生命科学 / 医疗科技市场情报

> Prioritized life-science & medtech market signals — **tuned to who you are and what you need today.**
> 为你排好优先级的生命科学与医疗科技市场信号 —— 按角色与当下需求个性化筛选。

A bilingual (中文 / English) intelligence dashboard that turns the firehose of biotech/medtech
news into a **personalized, ranked, exportable** feed. Built for founders, investors, professionals,
students, and media — each gets a different view of the same signals.

![status](https://img.shields.io/badge/status-MVP-0d9488) ![next](https://img.shields.io/badge/Next.js-15-black) ![vercel](https://img.shields.io/badge/deploy-Vercel-black)

---

## What it does

| Capability | Detail |
|---|---|
| **Signal taxonomy** | VC deals · M&A · incubator/accelerator cohorts (YC, Flagship, F-Prime, Sequoia…) · institutional research reports · events |
| **Prioritization engine** | Every signal gets a 0–100 score from your **lens** (Deal Flow / Innovation / Research / Events / Overview) × **audience** × region × topic × recency × editorial impact — with a "why this is here" explanation on each card |
| **Personalization** | Multi-select target audience, expertise depth, focus regions (Boston · SF · NYC · Shenzhen-HK · Shanghai · Beijing · Global), and tracks |
| **Bilingual** | Full 中/EN toggle (top-right). Every record is stored bilingually |
| **AI digest** | Per-signal "so what" one-liners + an executive summary across your top-N, powered by Claude |
| **Export & share** | One-click PDF/print of a clean priority brief for stakeholders; copy-link sharing |
| **Events split** | Offline (your regions) vs online (EN/中文) |
| **Admin backend** | `/admin` — data overview, full table, manual ingestion trigger |
| **Auto-refresh** | Daily Vercel Cron runs an AI web-search ingestion pipeline into Supabase |

The app ships with **~56 real, sourced 2025–2026 signals** and runs with **zero backend** out of the box.
Wire up Supabase + Anthropic to make it live and self-updating.

---

## Tech stack

- **Next.js 15** (App Router) on **Vercel**
- **Supabase** (Postgres) for persistence — optional; falls back to bundled seed data
- **Anthropic Claude** for summaries (`claude-haiku-4-5`) and ingestion (`claude-sonnet-4-6` + web search)
- **Tailwind CSS** + lucide icons
- **Vercel Cron** for scheduled ingestion

---

## Quick start (local)

```bash
npm install
cp .env.example .env.local   # fill in keys (all optional for a first run)
npm run dev                  # → http://localhost:3000
```

With **no env vars**, the app runs on bundled seed data, and AI features degrade gracefully
(showing the stored summaries instead of generated ones).

---

## Going live

### 1. Supabase (data persistence + admin)
1. Create a Supabase project.
2. Run [`supabase/schema.sql`](supabase/schema.sql) in the SQL editor.
3. Set env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only, for ingestion/admin writes)

### 2. Anthropic (AI summaries + ingestion)
- `ANTHROPIC_API_KEY`

### 3. Cron security
- `CRON_SECRET` — any random string. The `/api/ingest` endpoint requires it
  (Vercel automatically sends `Authorization: Bearer $CRON_SECRET` to cron paths).

### 4. Deploy to Vercel
```bash
vercel            # preview
vercel --prod     # production
```
`vercel.json` already registers the daily ingestion cron (`0 1 * * *`).
Add the env vars in the Vercel dashboard (or `vercel env add`).

---

## How prioritization works

`src/lib/scoring.ts` blends:

```
lens     = 0.5·intent_affinity + 0.5·audience_affinity      // "does this matter to me at all"
context  = 0.30·region + 0.25·topic + 0.28·recency + 0.17·importance
score    = 100 · (0.55·lens + 0.45·context)
```

- **Intent** (the lens you pick for the session) reweights signal *types* — e.g. *Deal Flow* boosts VC/M&A, *Innovation* boosts cohorts.
- **Audience** reweights by role — investors weight deals, students weight cohorts & reports.
- **Events** use "soonness" (registration urgency) rather than decay.

Change your lens or profile and the whole feed re-ranks instantly.

---

## Project structure

```
src/
  app/
    page.tsx              # main feed (server → AppShell)
    admin/page.tsx        # data backend + ingestion
    api/summarize/route.ts# AI digest (single + executive summary)
    api/ingest/route.ts   # Cron: AI web-search → Supabase
  components/             # AppShell, LensBar, SignalCard, Onboarding, DigestModal…
  lib/
    types.ts  taxonomy.ts  scoring.ts  i18n.ts  prefs.ts  data.ts  supabase.ts
  data/seed.ts            # bundled real 2025–2026 signals
supabase/schema.sql
vercel.json               # cron registration
```

---

## Roadmap ideas

- Supabase Auth → sync prefs & saved items across devices
- Email / push digests (tie into the scheduled-task flow)
- Per-source connectors (RSS, official APIs) alongside AI web-search
- "Compare lenses" side-by-side view
