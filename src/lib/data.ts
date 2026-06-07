import "server-only";
import type { Signal } from "./types";
import { getSupabase } from "./supabase";
import { SEED_SIGNALS } from "@/data/seed";

// Reads signals from Supabase if configured, otherwise from bundled seed data.
// This keeps the app fully functional on a fresh clone with no backend.

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
      .limit(500);
    if (!error && data && data.length) {
      return { signals: data as Signal[], source: "supabase" };
    }
  }
  return { signals: SEED_SIGNALS, source: "seed" };
}

export function getSignalById(id: string): Signal | undefined {
  return SEED_SIGNALS.find((s) => s.id === id);
}
