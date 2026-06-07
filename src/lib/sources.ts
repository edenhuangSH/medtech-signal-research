import type { Region, SignalType } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Source catalog — the "pool" the user draws from.
// Each source declares what it produces, where it covers, how it's ingested,
// and whether it needs the user's own credentials (BYO = bring your own).
//
// Free sources (rss/websearch) work out of the box. Gated sources (requiresAuth)
// stay locked until the user connects their own account/API key in Connections —
// this keeps private data legal (the user is the authorized party) and scalable.
// ─────────────────────────────────────────────────────────────────────────────

export type SourceCategory =
  | "deal-tracker"
  | "vc-firm"
  | "accelerator"
  | "research"
  | "events"
  | "china"
  | "private";

export type SourceMethod = "rss" | "websearch" | "api";

export interface Source {
  id: string;
  name: string;
  category: SourceCategory;
  produces: SignalType[];
  /** Primary geographic coverage; empty / ["global"] = broad. */
  regions: Region[];
  method: SourceMethod;
  /** Gated/private — needs the user's own credential before it can be enabled. */
  requiresAuth: boolean;
  /** What credential to ask for, e.g. "Crunchbase API key". */
  authLabel?: string;
  homepage: string;
  /** RSS feed (when method === "rss"). */
  rss?: string;
  /** Seed query for AI web-search ingestion (when method === "websearch"). */
  query?: string;
  blurb_en: string;
  blurb_zh: string;
  /** Included in the default pool for new users. */
  defaultOn: boolean;
}

export const SOURCE_CATEGORY_LABEL: Record<
  SourceCategory,
  { en: string; zh: string }
> = {
  "deal-tracker": { en: "Deal trackers", zh: "交易追踪" },
  "vc-firm": { en: "VC firms", zh: "风投机构" },
  accelerator: { en: "Accelerators", zh: "孵化器" },
  research: { en: "Research & reports", zh: "研报机构" },
  events: { en: "Event sources", zh: "活动来源" },
  china: { en: "China sources", zh: "中国来源" },
  private: { en: "Private / gated (connect your account)", zh: "私有 / 付费(需连接账号)" },
};

export const SOURCES: Source[] = [
  // ── Deal trackers (free) ───────────────────────────────────────────────────
  {
    id: "fierce-biotech",
    name: "Fierce Biotech",
    category: "deal-tracker",
    produces: ["vc", "mna", "report"],
    regions: ["global"],
    method: "rss",
    requiresAuth: false,
    homepage: "https://www.fiercebiotech.com",
    rss: "https://www.fiercebiotech.com/rss/xml",
    query: "Fierce Biotech latest biotech funding rounds and M&A",
    blurb_en: "Funding tracker, deals, R&D news",
    blurb_zh: "融资追踪、交易、研发资讯",
    defaultOn: true,
  },
  {
    id: "biopharma-dive",
    name: "BioPharma Dive",
    category: "deal-tracker",
    produces: ["vc", "mna", "report"],
    regions: ["global"],
    method: "rss",
    requiresAuth: false,
    homepage: "https://www.biopharmadive.com",
    rss: "https://www.biopharmadive.com/feeds/news/",
    query: "BioPharma Dive biotech deals and licensing",
    blurb_en: "Biopharma deals, pipeline, policy",
    blurb_zh: "生物制药交易、管线、政策",
    defaultOn: true,
  },
  {
    id: "medtech-dive",
    name: "MedTech Dive",
    category: "deal-tracker",
    produces: ["vc", "mna", "report"],
    regions: ["global"],
    method: "rss",
    requiresAuth: false,
    homepage: "https://www.medtechdive.com",
    rss: "https://www.medtechdive.com/feeds/news/",
    query: "MedTech Dive medical device funding and acquisitions",
    blurb_en: "Medical device industry news",
    blurb_zh: "医疗器械行业资讯",
    defaultOn: true,
  },
  {
    id: "endpoints-news",
    name: "Endpoints News",
    category: "deal-tracker",
    produces: ["vc", "mna"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://endpts.com",
    query: "Endpoints News biotech financing rounds 2026",
    blurb_en: "Biopharma business news (free tier)",
    blurb_zh: "生物制药商业资讯(免费部分)",
    defaultOn: true,
  },

  // ── VC firms ───────────────────────────────────────────────────────────────
  {
    id: "flagship",
    name: "Flagship Pioneering",
    category: "vc-firm",
    produces: ["cohort", "vc", "report"],
    regions: ["boston"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.flagshippioneering.com",
    query: "Flagship Pioneering new company launch unveils 2026",
    blurb_en: "Venture creation (Moderna's founder)",
    blurb_zh: "原创公司孵化(Moderna 缔造者)",
    defaultOn: true,
  },
  {
    id: "fprime",
    name: "F-Prime Capital",
    category: "vc-firm",
    produces: ["vc", "report", "cohort"],
    regions: ["boston", "global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://fprimecapital.com",
    query: "F-Prime Capital life science investment new portfolio 2026",
    blurb_en: "Fidelity's life-science venture arm",
    blurb_zh: "富达旗下生命科学风投",
    defaultOn: true,
  },
  {
    id: "a16z-bio",
    name: "a16z Bio + Health",
    category: "vc-firm",
    produces: ["vc", "report"],
    regions: ["sf", "global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://a16z.com/bio-health/",
    query: "Andreessen Horowitz Bio Health new investment 2026",
    blurb_en: "a16z bio + health investments",
    blurb_zh: "a16z 生物健康投资",
    defaultOn: true,
  },
  {
    id: "sequoia",
    name: "Sequoia Capital",
    category: "vc-firm",
    produces: ["vc", "cohort"],
    regions: ["sf", "global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.sequoiacap.com",
    query: "Sequoia Capital healthcare biotech investment 2026",
    blurb_en: "Sequoia health/bio bets",
    blurb_zh: "红杉医疗/生物投资",
    defaultOn: true,
  },
  {
    id: "arch-venture",
    name: "ARCH Venture Partners",
    category: "vc-firm",
    produces: ["vc", "cohort"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.archventure.com",
    query: "ARCH Venture Partners biotech financing 2026",
    blurb_en: "Deep-science biotech creation",
    blurb_zh: "硬科技生物创建",
    defaultOn: true,
  },

  // ── Accelerators ───────────────────────────────────────────────────────────
  {
    id: "yc",
    name: "Y Combinator",
    category: "accelerator",
    produces: ["cohort"],
    regions: ["sf", "global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.ycombinator.com",
    query: "Y Combinator latest batch bio health companies",
    blurb_en: "YC bio/health batches",
    blurb_zh: "YC 生物/健康批次",
    defaultOn: true,
  },
  {
    id: "indiebio",
    name: "IndieBio / SOSV",
    category: "accelerator",
    produces: ["cohort"],
    regions: ["sf", "nyc"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://indiebio.co",
    query: "IndieBio SOSV biotech accelerator cohort 2026",
    blurb_en: "Early-stage biotech accelerator",
    blurb_zh: "早期生物科技加速器",
    defaultOn: true,
  },
  {
    id: "nucleate",
    name: "Nucleate",
    category: "accelerator",
    produces: ["cohort"],
    regions: ["boston", "global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://nucleate.org",
    query: "Nucleate Activator academic biotech cohort 2026",
    blurb_en: "Academic founder venture program",
    blurb_zh: "学术创始人创业项目",
    defaultOn: true,
  },

  // ── Research & reports ─────────────────────────────────────────────────────
  {
    id: "svb",
    name: "Silicon Valley Bank",
    category: "research",
    produces: ["report"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.svb.com/trends-insights/",
    query: "SVB healthcare investments and exits report",
    blurb_en: "Healthcare investments & exits",
    blurb_zh: "医疗投资与退出报告",
    defaultOn: true,
  },
  {
    id: "rock-health",
    name: "Rock Health",
    category: "research",
    produces: ["report"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://rockhealth.com/insights/",
    query: "Rock Health digital health funding report 2026",
    blurb_en: "Digital health funding data",
    blurb_zh: "数字健康融资数据",
    defaultOn: true,
  },
  {
    id: "mckinsey",
    name: "McKinsey",
    category: "research",
    produces: ["report"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.mckinsey.com/industries/healthcare",
    query: "McKinsey healthcare life sciences outlook 2026",
    blurb_en: "Healthcare strategy outlooks",
    blurb_zh: "医疗战略展望",
    defaultOn: true,
  },
  {
    id: "deloitte",
    name: "Deloitte",
    category: "research",
    produces: ["report"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.deloitte.com",
    query: "Deloitte global health care medtech outlook 2026",
    blurb_en: "Life-science & medtech outlooks",
    blurb_zh: "生命科学与器械展望",
    defaultOn: true,
  },
  {
    id: "bain",
    name: "Bain & Company",
    category: "research",
    produces: ["report"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.bain.com/insights/",
    query: "Bain medtech healthcare M&A report 2026",
    blurb_en: "Healthcare M&A & strategy",
    blurb_zh: "医疗并购与战略",
    defaultOn: true,
  },
  {
    id: "ey",
    name: "EY",
    category: "research",
    produces: ["report"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.ey.com/en_us/life-sciences",
    query: "EY biotech beyond borders pulse of medtech report",
    blurb_en: "Biotech & medtech benchmarks",
    blurb_zh: "生物科技与器械基准",
    defaultOn: true,
  },
  {
    id: "galen-growth",
    name: "Galen Growth",
    category: "research",
    produces: ["report"],
    regions: ["shanghai", "global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.galengrowth.com",
    query: "Galen Growth Asia Pacific digital health funding report",
    blurb_en: "Asia-Pacific healthtech data",
    blurb_zh: "亚太健康科技数据",
    defaultOn: true,
  },
  {
    id: "nature-biotech",
    name: "Nature Biotechnology",
    category: "research",
    produces: ["report"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.nature.com/nbt/",
    query: "Nature Biotechnology trends analysis 2026",
    blurb_en: "Scientific trend analysis",
    blurb_zh: "科学趋势分析",
    defaultOn: true,
  },

  // ── Event sources ──────────────────────────────────────────────────────────
  {
    id: "bio-org",
    name: "BIO / Convention",
    category: "events",
    produces: ["event"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.bio.org/events",
    query: "BIO International Convention partnering event 2026",
    blurb_en: "Biotech partnering conventions",
    blurb_zh: "生物技术合作大会",
    defaultOn: true,
  },
  {
    id: "jpmorgan",
    name: "J.P. Morgan Healthcare",
    category: "events",
    produces: ["event"],
    regions: ["sf"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.jpmorgan.com/about-us/events-conferences/health-care-conference",
    query: "JPMorgan Healthcare Conference 2026",
    blurb_en: "JPM Healthcare week",
    blurb_zh: "摩根大通医疗周",
    defaultOn: true,
  },
  {
    id: "hlth",
    name: "HLTH / ViVE",
    category: "events",
    produces: ["event"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.hlth.com",
    query: "HLTH ViVE digital health conference 2026",
    blurb_en: "Digital health conferences",
    blurb_zh: "数字健康大会",
    defaultOn: true,
  },
  {
    id: "informa-events",
    name: "Informa (BIO-Europe, LSX…)",
    category: "events",
    produces: ["event"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://informaconnect.com",
    query: "BIO-Europe LSX life science partnering event 2026",
    blurb_en: "EU/global partnering events",
    blurb_zh: "欧洲/全球合作活动",
    defaultOn: true,
  },
  {
    id: "eventbrite",
    name: "Eventbrite / local meetups",
    category: "events",
    produces: ["event"],
    regions: ["boston", "sf", "nyc"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.eventbrite.com",
    query: "biotech health-tech meetup Boston SF NYC 2026",
    blurb_en: "Local biotech meetups",
    blurb_zh: "本地生物科技聚会",
    defaultOn: true,
  },

  // ── China sources ──────────────────────────────────────────────────────────
  {
    id: "vbdata",
    name: "VBData 动脉网",
    category: "china",
    produces: ["vc", "mna", "report", "event"],
    regions: ["shanghai", "beijing", "shenzhen-hk"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.vbdata.cn",
    query: "动脉网 VBData 医疗健康 融资 并购 会议 2026",
    blurb_en: "China healthcare innovation media",
    blurb_zh: "中国医疗创新媒体(动脉网)",
    defaultOn: true,
  },
  {
    id: "cmef",
    name: "CMEF / China device fairs",
    category: "china",
    produces: ["event"],
    regions: ["shanghai", "beijing", "shenzhen-hk"],
    method: "websearch",
    requiresAuth: false,
    homepage: "https://www.cmef.com.cn",
    query: "CMEF 中国国际医疗器械博览会 2026",
    blurb_en: "China medical device fairs",
    blurb_zh: "中国医疗器械展会",
    defaultOn: true,
  },

  // ── Private / gated (BYO credentials) ──────────────────────────────────────
  {
    id: "crunchbase",
    name: "Crunchbase Pro",
    category: "private",
    produces: ["vc", "mna"],
    regions: ["global"],
    method: "api",
    requiresAuth: true,
    authLabel: "Crunchbase API key",
    homepage: "https://www.crunchbase.com",
    query: "",
    blurb_en: "Structured funding & M&A data",
    blurb_zh: "结构化融资与并购数据",
    defaultOn: false,
  },
  {
    id: "pitchbook",
    name: "PitchBook",
    category: "private",
    produces: ["vc", "mna", "report"],
    regions: ["global"],
    method: "api",
    requiresAuth: true,
    authLabel: "PitchBook API token",
    homepage: "https://pitchbook.com",
    query: "",
    blurb_en: "PE/VC deal intelligence",
    blurb_zh: "私募/风投交易情报",
    defaultOn: false,
  },
  {
    id: "cb-insights",
    name: "CB Insights",
    category: "private",
    produces: ["report", "vc", "mna"],
    regions: ["global"],
    method: "api",
    requiresAuth: true,
    authLabel: "CB Insights API key",
    homepage: "https://www.cbinsights.com",
    query: "",
    blurb_en: "Market intelligence platform",
    blurb_zh: "市场情报平台",
    defaultOn: false,
  },
  {
    id: "statnews",
    name: "STAT+ ",
    category: "private",
    produces: ["report", "mna", "vc"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: true,
    authLabel: "STAT+ session cookie / login",
    homepage: "https://www.statnews.com",
    query: "STAT News biotech analysis 2026",
    blurb_en: "Premium biotech journalism",
    blurb_zh: "高端生物科技报道",
    defaultOn: false,
  },
  {
    id: "newsapi",
    name: "NewsAPI (custom feed)",
    category: "private",
    produces: ["vc", "mna", "report", "event"],
    regions: ["global"],
    method: "api",
    requiresAuth: true,
    authLabel: "NewsAPI.org key",
    homepage: "https://newsapi.org",
    query: "",
    blurb_en: "Your own keyword news firehose",
    blurb_zh: "你自己的关键词新闻流",
    defaultOn: false,
  },

  // ── Catch-all for ingested items without a mapped source ────────────────────
  {
    id: "other-web",
    name: "Other web sources",
    category: "deal-tracker",
    produces: ["vc", "mna", "cohort", "report", "event"],
    regions: ["global"],
    method: "websearch",
    requiresAuth: false,
    homepage: "",
    query: "life science medtech market signals 2026",
    blurb_en: "Miscellaneous web findings",
    blurb_zh: "其他网络来源",
    defaultOn: true,
  },
];

export const SOURCE_BY_ID: Record<string, Source> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s])
);

export const DEFAULT_ON_IDS = SOURCES.filter((s) => s.defaultOn).map((s) => s.id);

/** Normalize a signal's source_id to a known catalog id (fallback: other-web). */
export function resolveSourceId(id?: string | null): string {
  if (id && SOURCE_BY_ID[id]) return id;
  return "other-web";
}

// Map an org name or source URL to a catalog source id, so seed/legacy signals
// without an explicit source_id still attribute to the right pool. Gated
// publishers (cb-insights, statnews, crunchbase, pitchbook) map to "other-web"
// for items we ALREADY have — gating only applies to live ingestion, not data
// we already hold.
const ORG_HINTS: [RegExp, string][] = [
  [/flagship/i, "flagship"],
  [/f-?prime/i, "fprime"],
  [/\barch\b/i, "arch-venture"],
  [/sequoia/i, "sequoia"],
  [/andreessen|a16z/i, "a16z-bio"],
  [/y combinator/i, "yc"],
  [/nucleate/i, "nucleate"],
  [/indiebio|sosv/i, "indiebio"],
];
const DOMAIN_HINTS: [string, string][] = [
  ["fiercebiotech.com", "fierce-biotech"],
  ["biopharmadive.com", "biopharma-dive"],
  ["medtechdive.com", "medtech-dive"],
  ["ycombinator.com", "yc"],
  ["allhealthtech.com", "yc"],
  ["flagshippioneering.com", "flagship"],
  ["fprimecapital.com", "fprime"],
  ["a16z.com", "a16z-bio"],
  ["svb.com", "svb"],
  ["rockhealth.com", "rock-health"],
  ["mckinsey.com", "mckinsey"],
  ["deloitte.com", "deloitte"],
  ["bain.com", "bain"],
  ["ey.com", "ey"],
  ["galengrowth.com", "galen-growth"],
  ["nature.com", "nature-biotech"],
  ["nucleatehq.com", "nucleate"],
  ["indiebio.co", "indiebio"],
  ["convention.bio.org", "bio-org"],
  ["bio.org", "bio-org"],
  ["jpmorgan.com", "jpmorgan"],
  ["hlth.com", "hlth"],
  ["informaconnect.com", "informa-events"],
  ["cmef.com.cn", "cmef"],
  ["vbdata.cn", "vbdata"],
];

export function inferSourceId(s: {
  source_id?: string | null;
  org?: string | null;
  source_url?: string | null;
}): string {
  if (s.source_id && SOURCE_BY_ID[s.source_id]) return s.source_id;
  if (s.org) {
    for (const [re, id] of ORG_HINTS) if (re.test(s.org)) return id;
  }
  if (s.source_url) {
    const url = s.source_url.toLowerCase();
    for (const [dom, id] of DOMAIN_HINTS) if (url.includes(dom)) return id;
  }
  return "other-web";
}

/**
 * Whether a source is currently drawn from. A source uses its override if set,
 * else its catalog default. Gated sources also require a stored connection.
 */
export function isSourceEnabled(
  source: Source,
  overrides: Record<string, boolean>,
  connectedIds: Set<string>
): boolean {
  if (source.requiresAuth && !connectedIds.has(source.id)) return false;
  const ov = overrides[source.id];
  return ov !== undefined ? ov : source.defaultOn;
}

export function enabledSourceIdSet(
  overrides: Record<string, boolean>,
  connectedIds: Set<string>
): Set<string> {
  return new Set(
    SOURCES.filter((s) => isSourceEnabled(s, overrides, connectedIds)).map(
      (s) => s.id
    )
  );
}
