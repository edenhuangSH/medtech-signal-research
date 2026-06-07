import type { Lang } from "./types";

// Central UI string dictionary. Keep keys flat & descriptive.
export const STRINGS = {
  appName: { en: "Helix Signal", zh: "Helix 信号" },
  tagline: {
    en: "Life-science & medtech intelligence, prioritized for you",
    zh: "生命科学与医疗科技情报 · 为你排好优先级",
  },

  nav_feed: { en: "Signals", zh: "信号" },
  nav_events: { en: "Events", zh: "活动" },
  nav_saved: { en: "Saved", zh: "收藏" },
  nav_admin: { en: "Admin", zh: "后台" },

  // Lens / intent bar
  yourLens: { en: "Your lens today", zh: "今天的关注角度" },
  changeFocus: { en: "Personalize", zh: "个性化" },

  // Filters
  filters: { en: "Filters", zh: "筛选" },
  allTypes: { en: "All types", zh: "全部类型" },
  allRegions: { en: "All regions", zh: "全部地区" },
  allTopics: { en: "All topics", zh: "全部赛道" },
  reset: { en: "Reset", zh: "重置" },
  search: { en: "Search signals…", zh: "搜索信号…" },

  // Sort
  sortPriority: { en: "Priority for you", zh: "为你优先" },
  sortRecent: { en: "Most recent", zh: "最新" },
  sortImportance: { en: "Editorial impact", zh: "影响力" },

  // Cards
  whyHere: { en: "Why this is here", zh: "为何推荐" },
  priority: { en: "Priority", zh: "优先级" },
  source: { en: "Source", zh: "来源" },
  save: { en: "Save", zh: "收藏" },
  saved: { en: "Saved", zh: "已收藏" },
  aiDigest: { en: "AI digest", zh: "AI 摘要" },
  generating: { en: "Generating…", zh: "生成中…" },
  readMore: { en: "Open source", zh: "查看原文" },

  // Tiers
  tier_high: { en: "High priority", zh: "高优先级" },
  tier_medium: { en: "Worth a look", zh: "值得一看" },
  tier_low: { en: "Background", zh: "背景信息" },

  // Digest / export
  buildDigest: { en: "Build digest", zh: "生成简报" },
  digestTitle: { en: "Your priority digest", zh: "你的优先级简报" },
  exportPdf: { en: "Export / Print", zh: "导出 / 打印" },
  share: { en: "Share", zh: "分享" },
  copyLink: { en: "Copy link", zh: "复制链接" },
  linkCopied: { en: "Link copied", zh: "链接已复制" },
  topN: { en: "Top items", zh: "精选条目" },

  // Onboarding
  ob_title: { en: "Tune your feed", zh: "定制你的信息流" },
  ob_sub: {
    en: "Two minutes now saves you the firehose later. You can change this anytime.",
    zh: "现在花两分钟，之后免受信息轰炸。随时可改。",
  },
  ob_who: { en: "Who are you? (multi-select)", zh: "你是谁?(可多选)" },
  ob_depth: { en: "How deep should we go?", zh: "信息深度?" },
  ob_regions: { en: "Regions you care about", zh: "你关注的地区" },
  ob_topics: { en: "Tracks you care about (optional)", zh: "你关注的赛道(可选)" },
  ob_done: { en: "See my signals", zh: "查看我的信号" },
  ob_skip: { en: "Skip — use defaults", zh: "跳过，用默认设置" },

  // Empty / loading
  empty: { en: "No signals match. Loosen your filters.", zh: "没有匹配信号，放宽筛选试试。" },
  loading: { en: "Loading signals…", zh: "加载信号中…" },

  // Sources / pool
  sources: { en: "Sources", zh: "信号源" },
  sourcePool: { en: "Source pool", zh: "信号源池" },
  sourcePoolSub: {
    en: "Choose which sources feed your signals. Connect private accounts to unlock gated data.",
    zh: "选择从哪些来源拉取信号。连接私有账号可解锁付费/登录数据。",
  },
  enableAll: { en: "Enable all", zh: "全部启用" },
  disableAll: { en: "Disable all", zh: "全部停用" },
  connect: { en: "Connect", zh: "连接" },
  connected: { en: "Connected", zh: "已连接" },
  disconnect: { en: "Disconnect", zh: "断开" },
  needsConnection: { en: "Needs your account", zh: "需连接账号" },
  enterCredential: { en: "Paste your credential", zh: "粘贴你的凭证" },
  credentialNote: {
    en: "Stored locally for now. Used only to fetch from this source. Never shared.",
    zh: "目前仅存于本地,仅用于从该源拉取,不会分享。",
  },
  sourcesEnabled: { en: "sources on", zh: "个源启用" },
  poolStatus: { en: "in pool", zh: "在池中" },

  // Misc
  refresh: { en: "Refresh data", zh: "刷新数据" },
  lastUpdated: { en: "Updated", zh: "更新于" },
  online: { en: "Online", zh: "线上" },
  offline: { en: "In-person", zh: "线下" },
  upcoming: { en: "Upcoming", zh: "即将" },
} as const;

export type StringKey = keyof typeof STRINGS;

export function t(key: StringKey, lang: Lang): string {
  return STRINGS[key][lang];
}
