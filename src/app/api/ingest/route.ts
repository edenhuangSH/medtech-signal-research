import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdmin } from "@/lib/supabase";

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

  const prompt = `Search the web for the most recent (last 14 days) life-science / biotech / medtech / digital-health market signals across these categories: new VC funding rounds, M&A deals, incubator/accelerator cohort announcements (Y Combinator, Flagship Pioneering, F-Prime, Sequoia, IndieBio), flagship research reports, and upcoming industry events/conferences.

Prioritize signals from top global institutions and pay special attention to neurotech / neuromodulation.

After searching, output ONLY a JSON array (no prose) of the items you found, following this schema exactly:
${INGEST_SCHEMA}

Aim for 10-20 high-quality, real, verifiable items with working source_url links.`;

  let items: any[] = [];
  try {
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 } as any],
      messages: [{ role: "user", content: prompt }],
    });
    const text = msg.content
      .filter((c) => c.type === "text")
      .map((c: any) => c.text)
      .join("\n");
    const match = text.match(/\[[\s\S]*\]/);
    if (match) items = JSON.parse(match[0]);
  } catch (e) {
    return NextResponse.json({ ok: false, reason: "search failed", error: String(e) });
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
      importance: it.importance ?? 3,
      format: it.format ?? null,
      language: it.language ?? null,
    }));

  if (!rows.length) return NextResponse.json({ ok: true, ingested: 0, note: "no items parsed" });

  const { error } = await sb.from("signals").upsert(rows, { onConflict: "id" });
  if (error) return NextResponse.json({ ok: false, reason: "db upsert failed", error: error.message });

  return NextResponse.json({ ok: true, ingested: rows.length });
}

function slug(url: string, title: string): string {
  const base = (url + "|" + title).toLowerCase();
  let h = 0;
  for (let i = 0; i < base.length; i++) h = (Math.imul(31, h) + base.charCodeAt(i)) | 0;
  return "ing-" + (h >>> 0).toString(36);
}
