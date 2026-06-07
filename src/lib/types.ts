// ── Core domain model ────────────────────────────────────────────────────────

export type SignalType = "vc" | "mna" | "cohort" | "report" | "event";

export type Region =
  | "boston"
  | "sf"
  | "nyc"
  | "shenzhen-hk"
  | "shanghai"
  | "beijing"
  | "global"
  | "other";

export type EventFormat = "offline" | "online";
export type Lang = "en" | "zh";
export type EventLang = "en" | "zh" | "both";

/** Bilingual signal record. One row in the `signals` table. */
export interface Signal {
  id: string;
  type: SignalType;

  title_en: string;
  title_zh: string;
  summary_en: string;
  summary_zh: string;

  /** Source institution: investor, acquirer, incubator, publisher, organizer. */
  org: string | null;
  /** The subject: company funded/acquired, startup in cohort. */
  target: string | null;

  amount_usd: number | null;
  amount_display: string | null;

  /** ISO date string (event start date for events). */
  date: string;
  region: Region;
  topics: string[];

  source_url: string | null;
  /** Catalog source this signal came from (see lib/sources.ts). */
  source_id?: string | null;
  /** Editorial importance 1–5, independent of the per-user priority score. */
  importance: number;

  // Event-only fields
  format?: EventFormat | null;
  language?: EventLang | null;

  /** Optional AI-generated bilingual digest, lazily filled. */
  ai_digest_en?: string | null;
  ai_digest_zh?: string | null;

  created_at?: string;
}

// ── Personalization ──────────────────────────────────────────────────────────

export type Audience =
  | "professional" // 在职专业人士
  | "founder" // 创业者/企业
  | "investor" // 投资人
  | "student" // 学生/学术
  | "media" // 媒体人
  | "enthusiast"; // 兴趣职场人士

export type Expertise = "beginner" | "intermediate" | "expert";

/** What the user wants *today* — the "lens". Changes the ranking weights. */
export type Intent =
  | "deals" // 看交易/资金动向
  | "innovation" // 看新公司/赛道
  | "research" // 看研报/趋势
  | "networking" // 看活动/路演
  | "overview"; // 全局概览

export interface UserPrefs {
  audiences: Audience[];
  expertise: Expertise;
  regions: Region[];
  topics: string[];
  lang: Lang;
  /** Selected lens for the current session. */
  intent: Intent;
  /**
   * Per-source on/off overrides keyed by source id. A source not present here
   * uses its catalog `defaultOn`. Gated sources additionally require a stored
   * connection before they count as enabled. Robust to the catalog growing.
   */
  sourceOverrides: Record<string, boolean>;
}

export const DEFAULT_PREFS: UserPrefs = {
  audiences: ["founder"],
  expertise: "intermediate",
  regions: ["boston", "sf", "shenzhen-hk", "global"],
  topics: [],
  lang: "zh",
  intent: "overview",
  sourceOverrides: {},
};
