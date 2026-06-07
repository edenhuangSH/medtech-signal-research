import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SOURCES, SOURCE_BY_ID } from "@/lib/sources";
import { fetchAllRss, type RawItem } from "@/lib/ingest-rss";

// ── Automated ingestion (Vercel Cron) ────────────────────────────────────────
// Two engines, combined:
//   1. RSS  — fetch free RSS feeds, then Claude classifies/translates the
//             headlines into the bilingual Signal schema (cheap, no web search).
//   2. Web  — per-source targeted web search for sources without RSS (events,
//             VC firms, China), capped to fit the time budget.
// Results are deduped by id and upserted into Supabase. Protected by CRON_SECRET.
// Safe no-op if keys are missing.

export const runtime = "nodejs";
export const maxDuration = 300;

const STRUCT_MODEL = "claude-haiku-4-5-20251001"; // cheap classify/translate
const SEARCH_MODEL = "claude-sonnet-4-6"; // web-search reasoning

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  if (req.nextUrl.searchParams.get("secret") === secret) return true;
  return false;
}

const SCHEMA = `Schema per item:
{
  "type": "vc" | "mna" | "cohort" | "report" | "event",
  "title_en": string, "title_zh": string,
  "summary_en": string (2-3 sentences), "summary_zh": string,
  "org": string|null, "target": string|null,
  "amount_usd": number|null, "amount_display": string|null,
  "date": "YYYY-MM-DD",
  "region": "boston"|"sf"|"nyc"|"shenzhen-hk"|"shanghai"|"beijing"|"global"|"other",
  "topics": string[] (from: ai-drug-discovery, oncology, neurotech, gene-therapy, medical-devices, diagnostics, digital-health, synthetic-biology, longevity, immunology, rare-disease, mental-health),
  "source_url": string, "importance": 1-5,
  "format": "offline"|"online"|null, "language": "en"|"zh"|"both"|null,
  "source_id": string
}`;

export async function GET(req: NextRequest) {
  return run(req);
}
export async function POST(req: NextRequest) {
  return run(req);
}

async function run(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const key = process.env.ANTHROPIC_API_KEY;
  const sb = getSupabaseAdmin();
  if (!key) return NextResponse.json({ ok: false, reason: "no ANTHROPIC_API_KEY" });

  // Body options: { sources?: string[], skipWeb?: boolean, skipRss?: boolean }
  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const onlyIds: Set<string> | undefined = Array.isArray(body?.sources)
    ? new Set(body.sources)
    : undefined;

  const client = new Anthropic({ apiKey: key });
  const candidates: any[] = [];
  const stats: Record<string, any> = {};

  // ── Engine 1: RSS ──────────────────────────────────────────────────────────
  if (!body?.skipRss) {
    const raw = await fetchAllRss(10, onlyIds);
    stats.rssFetched = raw.length;
    if (raw.length) {
      try {
        const structured = await structureRss(client, raw);
        candidates.push(...structured);
        stats.rssStructured = structured.length;
      } catch (e) {
        stats.rssError = String(e);
      }
    }
  }

  // ── Engine 2: targeted web search (non-RSS sources) ─────────────────────────
  if (!body?.skipWeb) {
    const webTargets = (
      onlyIds
        ? [...onlyIds].map((id) => SOURCE_BY_ID[id]).filter(Boolean)
        : SOURCES.filter(
            (s) =>
              !s.requiresAuth &&
              s.method === "websearch" &&
              s.query &&
              s.id !== "other-web"
          )
    ).slice(0, 6);
    const perSource: Record<string, number> = {};
    for (const src of webTargets) {
      try {
        const items = await searchSource(client, src);
        candidates.push(...items);
        perSource[src.id] = items.length;
      } catch {
        perSource[src.id] = -1;
      }
    }
    stats.web = perSource;
  }

  // ── Normalize, dedupe, upsert ────────────────────────────────────────────────
  const seen = new Set<string>();
  const rows = candidates
    .filter((it) => it && it.title_en && it.source_url)
    .map((it) => ({
      id: slug(it.source_url, it.title_en),
      type: it.type ?? "report",
      title_en: it.title_en,
      title_zh: it.title_zh ?? it.title_en,
      summary_en: it.summary_en ?? "",
      summary_zh: it.summary_zh ?? it.summary_en ?? "",
      org: it.org ?? null,
      target: it.target ?? null,
      amount_usd: typeof it.amount_usd === "number" ? it.amount_usd : null,
      amount_display: it.amount_display ?? null,
      date: it.date ?? new Date().toISOString().slice(0, 10),
      region: it.region ?? "global",
      topics: Array.isArray(it.topics) ? it.topics : [],
      source_url: it.source_url,
      source_id: it.source_id && SOURCE_BY_ID[it.source_id] ? it.source_id : "other-web",
      importance: it.importance ?? 3,
      format: it.format ?? null,
      language: it.language ?? null,
    }))
    .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));

  stats.candidates = candidates.length;
  stats.deduped = rows.length;

  if (!sb)
    return NextResponse.json({
      ok: true,
      persisted: false,
      reason: "no Supabase service role — preview only",
      ingested: 0,
      preview: rows.slice(0, 8),
      stats,
    });

  if (!rows.length) return NextResponse.json({ ok: true, ingested: 0, stats });

  const { error } = await sb.from("signals").upsert(rows, { onConflict: "id" });
  if (error)
    return NextResponse.json({ ok: false, reason: "db upsert failed", error: error.message, stats });

  return NextResponse.json({ ok: true, persisted: true, ingested: rows.length, stats });
}

// Classify + translate a batch of RSS headlines into the Signal schema.
async function structureRss(client: Anthropic, raw: RawItem[]): Promise<any[]> {
  const list = raw
    .slice(0, 40)
    .map(
      (r, i) =>
        `${i + 1}. [source_id=${r.source_id}] (${r.isoDate ?? "n/a"}) ${r.title}\n   ${r.snippet}\n   url: ${r.link}`
    )
    .join("\n");

  const prompt = `You are curating a life-science / medtech market-signal feed. Below are recent RSS headlines. Keep ONLY genuine market signals — VC funding rounds (vc), M&A / licensing (mna), incubator/accelerator cohorts (cohort), notable research reports (report), or industry events (event). DROP generic clinical-trial readouts, opinion, and regulatory minutiae that aren't a deal/report/event.

For each kept item, translate and classify into this schema. Preserve the given source_id and use the given url as source_url. Infer region/topics/amount from the text; if unknown use "global"/[]/null. Write concise bilingual title + 2-3 sentence summary.

${SCHEMA}

Headlines:
${list}

Output ONLY a JSON array of the kept, structured items. No prose.`;

  const msg = await client.messages.create({
    model: STRUCT_MODEL,
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content
    .filter((c) => c.type === "text")
    .map((c: any) => c.text)
    .join("\n");
  const match = text.match(/\[[\s\S]*\]/);
  return match ? JSON.parse(match[0]) : [];
}

// Targeted web search for a single non-RSS source.
async function searchSource(client: Anthropic, src: any): Promise<any[]> {
  const prompt = `Search the web for the most recent (last 21 days) life-science/biotech/medtech signals from: ${src.name} (${src.homepage}).
Focus: ${src.query}. Note neurotech/neuromodulation when relevant.

Output ONLY a JSON array following this schema. Set "source_id" to "${src.id}" on every item. 4-8 real items with working source_url links.
${SCHEMA}`;
  const msg = await client.messages.create({
    model: SEARCH_MODEL,
    max_tokens: 4000,
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 } as any],
    messages: [{ role: "user", content: prompt }],
  });
  const text = msg.content
    .filter((c) => c.type === "text")
    .map((c: any) => c.text)
    .join("\n");
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  const parsed = JSON.parse(match[0]);
  for (const it of parsed) if (it) it.source_id = it.source_id ?? src.id;
  return parsed;
}

function slug(url: string, title: string): string {
  const base = (url + "|" + title).toLowerCase();
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (Math.imul(31, h) + base.charCodeAt(i)) | 0;
  return "ing-" + (h >>> 0).toString(36);
}
