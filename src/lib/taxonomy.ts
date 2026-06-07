import type {
  Audience,
  Intent,
  Region,
  SignalType,
  Expertise,
} from "./types";

// ── Bilingual labels for every enum used in the UI ───────────────────────────

export const SIGNAL_TYPE_LABEL: Record<SignalType, { en: string; zh: string }> = {
  vc: { en: "VC Deal", zh: "融资" },
  mna: { en: "M&A", zh: "并购" },
  cohort: { en: "Cohort / Incubator", zh: "孵化器入选" },
  report: { en: "Research Report", zh: "研报" },
  event: { en: "Event", zh: "活动" },
};

export const REGION_LABEL: Record<Region, { en: string; zh: string }> = {
  boston: { en: "Boston", zh: "波士顿" },
  sf: { en: "San Francisco", zh: "旧金山" },
  nyc: { en: "New York", zh: "纽约" },
  "shenzhen-hk": { en: "Shenzhen · HK", zh: "深圳·香港" },
  shanghai: { en: "Shanghai", zh: "上海" },
  beijing: { en: "Beijing", zh: "北京" },
  global: { en: "Global", zh: "全球" },
  other: { en: "Other", zh: "其他" },
};

/** Regions the user can pick as "home" focus (excludes global/other). */
export const FOCUS_REGIONS: Region[] = [
  "boston",
  "sf",
  "nyc",
  "shenzhen-hk",
  "shanghai",
  "beijing",
];

export const AUDIENCE_LABEL: Record<
  Audience,
  { en: string; zh: string; blurb_en: string; blurb_zh: string }
> = {
  professional: {
    en: "Industry Professional",
    zh: "在职专业人士",
    blurb_en: "Working in life science / medtech",
    blurb_zh: "生命科学/医疗器械从业者",
  },
  founder: {
    en: "Founder / Company",
    zh: "创业者 / 企业",
    blurb_en: "Building or running a company",
    blurb_zh: "正在创业或经营企业",
  },
  investor: {
    en: "Investor",
    zh: "投资人",
    blurb_en: "VC, PE, angel, family office",
    blurb_zh: "VC / PE / 天使 / 家办",
  },
  student: {
    en: "Student / Academic",
    zh: "学生 / 学术",
    blurb_en: "Studying or researching the field",
    blurb_zh: "在校学习或科研",
  },
  media: {
    en: "Media / Analyst",
    zh: "媒体 / 分析师",
    blurb_en: "Covering or analyzing the industry",
    blurb_zh: "报道或分析行业",
  },
  enthusiast: {
    en: "Curious Professional",
    zh: "兴趣职场人士",
    blurb_en: "Exploring the space out of interest",
    blurb_zh: "出于兴趣关注该领域",
  },
};

export const EXPERTISE_LABEL: Record<
  Expertise,
  { en: string; zh: string; blurb_en: string; blurb_zh: string }
> = {
  beginner: {
    en: "New to the field",
    zh: "入门",
    blurb_en: "Plain-language summaries, more context",
    blurb_zh: "通俗摘要，更多背景",
  },
  intermediate: {
    en: "Familiar",
    zh: "熟悉",
    blurb_en: "Balanced detail",
    blurb_zh: "适中的细节",
  },
  expert: {
    en: "Expert",
    zh: "专家",
    blurb_en: "Dense, jargon-ok, signal over noise",
    blurb_zh: "高密度，可用术语，重信号",
  },
};

export const INTENT_LABEL: Record<
  Intent,
  { en: string; zh: string; blurb_en: string; blurb_zh: string; icon: string }
> = {
  overview: {
    en: "Overview",
    zh: "全局概览",
    blurb_en: "A balanced read across everything",
    blurb_zh: "各类信号均衡呈现",
    icon: "LayoutGrid",
  },
  deals: {
    en: "Deal Flow",
    zh: "交易动向",
    blurb_en: "VC rounds & M&A — who's moving capital",
    blurb_zh: "融资与并购，资金在往哪走",
    icon: "TrendingUp",
  },
  innovation: {
    en: "Innovation",
    zh: "前沿创新",
    blurb_en: "New companies, cohorts, emerging tracks",
    blurb_zh: "新公司、孵化器、新兴赛道",
    icon: "Sparkles",
  },
  research: {
    en: "Research & Trends",
    zh: "研报趋势",
    blurb_en: "Reports & analysis from top institutions",
    blurb_zh: "头部机构研报与分析",
    icon: "FileText",
  },
  networking: {
    en: "Events",
    zh: "活动路演",
    blurb_en: "Conferences, demo days, roadshows",
    blurb_zh: "会议、Demo Day、路演",
    icon: "Calendar",
  },
};

// ── Topic taxonomy (the tracks) ──────────────────────────────────────────────

export const TOPICS: { key: string; en: string; zh: string }[] = [
  { key: "ai-drug-discovery", en: "AI Drug Discovery", zh: "AI制药" },
  { key: "oncology", en: "Oncology", zh: "肿瘤" },
  { key: "neurotech", en: "Neurotech / Neuromod", zh: "神经科技/神经调控" },
  { key: "gene-therapy", en: "Gene & Cell Therapy", zh: "基因与细胞治疗" },
  { key: "medical-devices", en: "Medical Devices", zh: "医疗器械" },
  { key: "diagnostics", en: "Diagnostics", zh: "诊断" },
  { key: "digital-health", en: "Digital Health", zh: "数字健康" },
  { key: "synthetic-biology", en: "Synthetic Biology", zh: "合成生物" },
  { key: "longevity", en: "Longevity", zh: "长寿/抗衰" },
  { key: "immunology", en: "Immunology", zh: "免疫" },
  { key: "rare-disease", en: "Rare Disease", zh: "罕见病" },
  { key: "mental-health", en: "Mental Health", zh: "精神健康" },
];

export function topicLabel(key: string, lang: "en" | "zh"): string {
  const t = TOPICS.find((x) => x.key === key);
  if (t) return t[lang];
  // graceful fallback for tags not in the curated list
  return key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
