import "server-only";
import Parser from "rss-parser";
import { SOURCES, type Source } from "./sources";

// Fetches and normalizes RSS feeds for the free RSS-method sources. This is the
// production "engine": cheap, reliable, no per-user credentials, and it grows
// the pool every run. Raw items are later structured/translated by Claude into
// the bilingual Signal schema (see /api/ingest).

export interface RawItem {
  source_id: string;
  source_name: string;
  title: string;
  link: string;
  snippet: string;
  isoDate?: string;
}

const parser: Parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "HelixSignal/1.0 (+market-signal-research)" },
});

// Robust text extraction: some feeds (e.g. Fierce) wrap <title> content in an
// <a> tag, which xml2js surfaces as a nested object rather than a string.
function toText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return stripTags(v);
  if (Array.isArray(v)) return v.map(toText).join(" ");
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o._ === "string") return stripTags(o._);
    // recurse over values, skipping xml attribute bags ("$")
    return Object.entries(o)
      .filter(([k]) => k !== "$")
      .map(([, val]) => toText(val))
      .join(" ")
      .trim();
  }
  return stripTags(String(v));
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchRssForSource(src: Source, max = 10): Promise<RawItem[]> {
  if (!src.rss) return [];
  try {
    const feed = await parser.parseURL(src.rss);
    return (feed.items ?? [])
      .slice(0, max)
      .map((it) => ({
        source_id: src.id,
        source_name: src.name,
        title: toText(it.title),
        link: typeof it.link === "string" ? it.link : toText(it.link),
        snippet: toText(
          (it as any).contentSnippet ?? it.content ?? (it as any).summary ?? ""
        ).slice(0, 500),
        isoDate: it.isoDate,
      }))
      .filter((r) => r.title && r.link);
  } catch {
    return [];
  }
}

/** Fetch all RSS-method sources (optionally restricted to a set of ids). */
export async function fetchAllRss(
  maxPerSource = 10,
  onlyIds?: Set<string>
): Promise<RawItem[]> {
  const rssSources = SOURCES.filter(
    (s) => s.method === "rss" && s.rss && (!onlyIds || onlyIds.has(s.id))
  );
  const results = await Promise.all(
    rssSources.map((s) => fetchRssForSource(s, maxPerSource))
  );
  return results.flat();
}
