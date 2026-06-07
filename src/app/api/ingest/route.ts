import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";
import { SOURCES, SOURCE_BY_ID } from "@/lib/sources";

// ── Automated ingestion (Vercel Cron) ────────────────────────────────────────
// Uses Claude's web_search tool to gather fresh life-science/medtech signals,
// then upserts them into the Supabase `signals` table (deduped by id).
// Protected by CRON_SECRET. Safe no-op if keys are missing.

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = "claude-sonnet-4-6";

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // allow if unset (dev)
  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  if (req.nextUrl.searchParams.get("secret") === secret) return true;
  return false;
}

const INGEST_SCHEMA = `Return a JSON array. Each item:
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
  "format": "offline"|"online"|null, "language": "en"|"zh"|"both"|null
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
  if (!sb) return NextResponse.json({ ok: false, reason: "no Supabase service role configured" });

  const client = new Anthropic({ apiKey: key });

  // Which sources to ingest from. Body may pass {sources:[ids]}; default = free,
  // searchable sources. Gated sources are skipped here (they'd run per-user with
  // the user's own credentials in a production worker). Capped to fit maxDuration.
  let requested: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.sources)) requested = body.sources;
  } catch {}
  const targets = (
    requested.length
      ? requested.map((id) => SOURCE_BY_ID[id]).filter(Boolean)
      : SOURCES.filter(
          (s) => !s.requiresAuth && s.method !== "rss" && s.query && s.id !== "other-web"
        )
  ).slice(0, 8);

  // One targeted web search per source, tagged with its source_id.
  const items: any[] = [];
  const perSource: Record<string, number> = {};
  for (const src of targets) {
    const prompt = `Search the web for the most recent (last 21 days) life-science / biotech / medtech / digital-health market signals from this source: ${src.name} (${src.homepage}).
Focus query: ${src.query}
Pay special attention to neurotech / neuromodulation when relevant.

Output ONLY a JSON array (no prose) following this schema exactly:
${INGEST_SCHEMA}
Set "source_id" to "${src.id}" on every item. Aim for 4-8 real, verifiable items with working source_url links.`;
    try {
      const msg = await client.messages.create({
        model: MODEL,
        max_tokens: 4000,
        tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 3 } as any],
        messages: [{ role: "user", content: prompt }],
      });
      const text = msg.content
        .filter((c) => c.type === "text")
        .map((c: any) => c.text)
        .join("\n");
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        for (const it of parsed) {
          if (it) it.source_id = it.source_id ?? src.id;
        }
        items.push(...parsed);
        perSource[src.id] = parsed.length;
      }
    } catch {
      perSource[src.id] = -1; // mark failure, continue with other sources
    }
  }

  // Normalize + dedupe-friendly id from source_url.
  const rows = items
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
      source_id: it.source_id ?? null,
      importance: it.importance ?? 3,
      format: it.format ?? null,
      language: it.language ?? null,
    }));

  if (!rows.length)
    return NextResponse.json({ ok: true, ingested: 0, perSource, note: "no items parsed" });

  const { error } = await sb.from("signals").upsert(rows, { onConflict: "id" });
  if (error) return NextResponse.json({ ok: false, reason: "db upsert failed", error: error.message });

  return NextResponse.json({ ok: true, ingested: rows.length, perSource });
}

function slug(url: string, title: string): string {
  const base = (url + "|" + title).toLowerCase();
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (Math.imul(31, h) + base.charCodeAt(i)) | 0;
  return "ing-" + (h >>> 0).toString(36);
}
