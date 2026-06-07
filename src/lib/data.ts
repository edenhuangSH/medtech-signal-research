import "server-only";
import type { Signal } from "./types";
import { getSupabase } from "./supabase";
import { inferSourceId } from "./sources";
import { SEED_SIGNALS } from "@/data/seed";
import { EXTRA_SIGNALS } from "@/data/seed_extra";

// Reads signals from Supabase if configured, otherwise from bundled seed data.
// This keeps the app fully functional on a fresh clone with no backend.

/** Ensure every signal has a resolved catalog source_id (for the pool selector). */
function withSources(signals: Signal[]): Signal[] {
  return signals.map((s) => ({ ...s, source_id: inferSourceId(s) }));
}

/** Merge seed + extras, dedupe by id. */
function bundled(): Signal[] {
  const seen = new Set<string>();
  const out: Signal[] = [];
  for (const s of [...SEED_SIGNALS, ...EXTRA_SIGNALS]) {
    if (seen.has(s.id)) continue;
    seen.add(s.id);
    out.push(s);
  }
  return withSources(out);
}

export async function fetchSignals(): Promise<{
  signals: Signal[];
  source: "supabase" | "seed";
}> {
  const sb = getSupabase();
  if (sb) {
    const { data, error } = await sb
      .from("signals")
      .select("*")
      .order("date", { ascending: false })
      .limit(1000);
    if (!error && data && data.length) {
      return { signals: withSources(data as Signal[]), source: "supabase" };
    }
  }
  return { signals: bundled(), source: "seed" };
}

export function getSignalById(id: string): Signal | undefined {
  return bundled().find((s) => s.id === id);
}
