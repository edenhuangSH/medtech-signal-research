import type {
  Audience,
  Intent,
  Signal,
  SignalType,
  UserPrefs,
} from "./types";

// ── Prioritization engine ────────────────────────────────────────────────────
// Produces a 0–100 priority score per signal, personalized by:
//   • Intent (the "lens" the user picked for this session)
//   • Audience (who they are — investors weight deals, students weight cohorts…)
//   • Region & topic focus
//   • Recency + editorial importance
// Every score comes with human-readable "reasons" so the UI can explain ranking.

/** Per-intent affinity for each signal type (0–1). The "lens" multiplier. */
const INTENT_TYPE_WEIGHT: Record<Intent, Record<SignalType, number>> = {
  overview: { vc: 0.85, mna: 0.85, cohort: 0.85, report: 0.85, event: 0.7 },
  deals: { vc: 1.0, mna: 1.0, cohort: 0.5, report: 0.55, event: 0.35 },
  innovation: { vc: 0.7, mna: 0.45, cohort: 1.0, report: 0.55, event: 0.5 },
  research: { vc: 0.5, mna: 0.5, cohort: 0.5, report: 1.0, event: 0.45 },
  networking: { vc: 0.35, mna: 0.35, cohort: 0.5, report: 0.4, event: 1.0 },
};

/** Per-audience affinity for each signal type (0–1). Who-you-are multiplier. */
const AUDIENCE_TYPE_WEIGHT: Record<Audience, Record<SignalType, number>> = {
  investor: { vc: 1.0, mna: 1.0, cohort: 0.85, report: 0.8, event: 0.6 },
  founder: { vc: 0.9, mna: 0.7, cohort: 0.9, report: 0.7, event: 0.85 },
  professional: { vc: 0.7, mna: 0.75, cohort: 0.7, report: 0.85, event: 0.7 },
  student: { vc: 0.55, mna: 0.5, cohort: 0.9, report: 0.9, event: 0.8 },
  media: { vc: 0.9, mna: 0.95, cohort: 0.8, report: 0.85, event: 0.6 },
  enthusiast: { vc: 0.7, mna: 0.7, cohort: 0.8, report: 0.75, event: 0.75 },
};

const NOW_MS = () => Date.now();
const DAY = 1000 * 60 * 60 * 24;

/** Recency score 0–1. For events, "soonness" of an upcoming date matters. */
function recencyScore(signal: Signal): number {
  const t = new Date(signal.date).getTime();
  if (Number.isNaN(t)) return 0.5;
  const deltaDays = (t - NOW_MS()) / DAY;

  if (signal.type === "event") {
    if (deltaDays < -2) return 0.05; // already happened
    if (deltaDays <= 14) return 1.0; // imminent — register now
    if (deltaDays <= 45) return 0.85;
    if (deltaDays <= 90) return 0.65;
    return 0.4; // far future
  }
  // News-like: exponential decay, ~45-day half-life
  const ageDays = Math.max(0, -deltaDays);
  return Math.max(0.1, Math.pow(0.5, ageDays / 45));
}

export interface ScoredSignal {
  signal: Signal;
  score: number; // 0–100
  reasons: { en: string; zh: string }[];
  tier: "high" | "medium" | "low";
}

export function scoreSignal(signal: Signal, prefs: UserPrefs): ScoredSignal {
  const reasons: { en: string; zh: string }[] = [];

  // 1. Lens (intent) — strongest single lever.
  const intentW = INTENT_TYPE_WEIGHT[prefs.intent][signal.type];

  // 2. Audience fit — averaged across all selected audiences.
  const auds = prefs.audiences.length ? prefs.audiences : (["founder"] as Audience[]);
  const audW =
    auds.reduce((s, a) => s + AUDIENCE_TYPE_WEIGHT[a][signal.type], 0) /
    auds.length;

  // 3. Region focus.
  let regionW = 0.6; // baseline for non-matching regions
  if (signal.region === "global") {
    regionW = 0.8; // global signals are broadly relevant
  } else if (prefs.regions.includes(signal.region)) {
    regionW = 1.0;
    reasons.push({
      en: `In your focus region`,
      zh: `命中你关注的地区`,
    });
  }

  // 4. Topic focus.
  let topicW = 0.7;
  if (prefs.topics.length) {
    const hits = signal.topics.filter((t) => prefs.topics.includes(t));
    if (hits.length) {
      topicW = 1.0;
      reasons.push({
        en: `Matches your topics`,
        zh: `命中你关注的赛道`,
      });
    } else {
      topicW = 0.55;
    }
  }

  // 5. Recency / timeliness.
  const recW = recencyScore(signal);
  if (signal.type === "event" && recW >= 1.0) {
    reasons.push({ en: `Happening soon — register`, zh: `临近开始，可报名` });
  } else if (signal.type !== "event" && recW >= 0.85) {
    reasons.push({ en: `Fresh in the last weeks`, zh: `近期发布` });
  }

  // 6. Editorial importance (1–5 → 0.4–1.0).
  const impW = 0.4 + ((signal.importance - 1) / 4) * 0.6;
  if (signal.importance >= 4) {
    reasons.push({ en: `Landmark / high-impact`, zh: `重磅 / 高影响` });
  }

  // Weighted geometric-ish blend. Intent & audience are multiplicative gates;
  // region/topic/recency/importance are additive contributions.
  const lens = 0.5 * intentW + 0.5 * audW; // 0–1 "does this matter to me at all"
  const context =
    0.3 * regionW + 0.25 * topicW + 0.28 * recW + 0.17 * impW; // 0–1

  let score = 100 * (0.55 * lens + 0.45 * context);

  // Boost when the lens directly targets this type.
  if (intentW >= 1.0) score = Math.min(100, score * 1.08);

  score = Math.round(Math.max(0, Math.min(100, score)));

  const tier: ScoredSignal["tier"] =
    score >= 70 ? "high" : score >= 45 ? "medium" : "low";

  return { signal, score, reasons: reasons.slice(0, 3), tier };
}

export function rankSignals(
  signals: Signal[],
  prefs: UserPrefs
): ScoredSignal[] {
  return signals
    .map((s) => scoreSignal(s, prefs))
    .sort((a, b) => b.score - a.score);
}

/** Quick aggregate counts for the dashboard header. */
export function summarize(scored: ScoredSignal[]) {
  const high = scored.filter((s) => s.tier === "high").length;
  const byType: Record<string, number> = {};
  for (const s of scored) byType[s.signal.type] = (byType[s.signal.type] ?? 0) + 1;
  return { total: scored.length, high, byType };
}
