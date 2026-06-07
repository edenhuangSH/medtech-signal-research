"use client";

import { useState } from "react";
import {
  Bookmark,
  ExternalLink,
  Sparkles,
  TrendingUp,
  Building2,
  MapPin,
  Globe,
  Wifi,
} from "lucide-react";
import type { ScoredSignal } from "@/lib/scoring";
import type { Lang } from "@/lib/types";
import { SIGNAL_TYPE_LABEL, REGION_LABEL, topicLabel } from "@/lib/taxonomy";
import { t } from "@/lib/i18n";
import { cn, fmtDate, relativeDays, fmtAmount } from "@/lib/utils";

const TIER_STYLE = {
  high: { dot: "bg-accent", text: "text-accent", label: "tier_high" as const },
  medium: { dot: "bg-amber-500", text: "text-amber-600", label: "tier_medium" as const },
  low: { dot: "bg-faint", text: "text-faint", label: "tier_low" as const },
};

const TYPE_ACCENT: Record<string, string> = {
  vc: "bg-emerald-50 text-emerald-700 border-emerald-200",
  mna: "bg-violet-50 text-violet-700 border-violet-200",
  cohort: "bg-sky-50 text-sky-700 border-sky-200",
  report: "bg-amber-50 text-amber-700 border-amber-200",
  event: "bg-rose-50 text-rose-700 border-rose-200",
};

export function SignalCard({
  scored,
  lang,
  isSaved,
  onToggleSave,
}: {
  scored: ScoredSignal;
  lang: Lang;
  isSaved: boolean;
  onToggleSave: () => void;
}) {
  const { signal: s, score, reasons, tier } = scored;
  const [digest, setDigest] = useState<string | null>(s.ai_digest_en ? (lang === "zh" ? s.ai_digest_zh : s.ai_digest_en) ?? null : null);
  const [loading, setLoading] = useState(false);

  const title = lang === "zh" ? s.title_zh : s.title_en;
  const summary = lang === "zh" ? s.summary_zh : s.summary_en;
  const tierStyle = TIER_STYLE[tier];

  async function genDigest() {
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal: s, lang }),
      });
      const data = await res.json();
      setDigest(data.digest ?? summary);
    } catch {
      setDigest(summary);
    } finally {
      setLoading(false);
    }
  }

  const rel = relativeDays(s.date, lang);

  return (
    <article
      className={cn(
        "card print-break group relative p-4 transition-all hover:shadow-md sm:p-5",
        tier === "high" && "priority-glow"
      )}
    >
      {/* top row: type + score */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              "rounded-md border px-2 py-0.5 text-[11px] font-semibold",
              TYPE_ACCENT[s.type]
            )}
          >
            {SIGNAL_TYPE_LABEL[s.type][lang]}
          </span>
          {s.amount_display && s.type !== "report" && s.type !== "event" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink">
              <TrendingUp className="h-3 w-3 text-accent" />
              {fmtAmount(s.amount_usd, s.amount_display)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5"
            title={t("priority", lang)}
          >
            <span className={cn("h-2 w-2 rounded-full", tierStyle.dot)} />
            <span className={cn("font-mono text-xs font-bold", tierStyle.text)}>
              {score}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleSave}
            className={cn(
              "no-print transition-colors",
              isSaved ? "text-accent" : "text-faint hover:text-ink"
            )}
            title={t(isSaved ? "saved" : "save", lang)}
          >
            <Bookmark className={cn("h-4 w-4", isSaved && "fill-current")} />
          </button>
        </div>
      </div>

      {/* title */}
      <h3 className="text-[15px] font-semibold leading-snug text-ink">{title}</h3>

      {/* meta line */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
        {s.org && (
          <span className="inline-flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {s.org}
          </span>
        )}
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {REGION_LABEL[s.region][lang]}
        </span>
        <span className={cn(rel?.includes(lang === "zh" ? "后" : "in") && s.type === "event" && "font-semibold text-accent")}>
          {fmtDate(s.date, lang)}
          {rel ? ` · ${rel}` : ""}
        </span>
        {s.type === "event" && s.format && (
          <span className="inline-flex items-center gap-1">
            {s.format === "online" ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <Globe className="h-3 w-3" />
            )}
            {t(s.format === "online" ? "online" : "offline", lang)}
          </span>
        )}
      </div>

      {/* summary */}
      <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{summary}</p>

      {/* ai digest */}
      {digest && (
        <div className="mt-2.5 rounded-lg border border-accent/20 bg-accent-soft/40 p-2.5 text-[12.5px] leading-relaxed text-ink">
          <span className="mb-0.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-accent">
            <Sparkles className="h-3 w-3" /> {t("aiDigest", lang)}
          </span>
          {digest}
        </div>
      )}

      {/* reasons (why this is here) */}
      {reasons.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {reasons.map((r, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[10.5px] font-medium text-muted"
            >
              <span className="h-1 w-1 rounded-full bg-accent" />
              {r[lang]}
            </span>
          ))}
        </div>
      )}

      {/* topics + actions */}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {s.topics.slice(0, 3).map((tp) => (
            <span key={tp} className="text-[10.5px] text-faint">
              #{topicLabel(tp, lang)}
            </span>
          ))}
        </div>
        <div className="no-print flex shrink-0 items-center gap-1.5">
          {!digest && (
            <button
              type="button"
              onClick={genDigest}
              disabled={loading}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-accent transition-colors hover:bg-accent-soft disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              {loading ? t("generating", lang) : t("aiDigest", lang)}
            </button>
          )}
          {s.source_url && (
            <a
              href={s.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <ExternalLink className="h-3 w-3" />
              {t("readMore", lang)}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
