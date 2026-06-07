"use client";

import { Activity, Languages, SlidersHorizontal, FileDown, Globe } from "lucide-react";
import type { Lang } from "@/lib/types";
import { t, STRINGS } from "@/lib/i18n";

export function TopBar({
  lang,
  onToggleLang,
  onPersonalize,
  onDigest,
  onSources,
  enabledSources,
}: {
  lang: Lang;
  onToggleLang: () => void;
  onPersonalize: () => void;
  onDigest: () => void;
  onSources: () => void;
  enabledSources: number;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-white">
            <Activity className="h-4 w-4" />
          </span>
          <div className="leading-tight">
            <div className="text-sm font-bold text-ink">
              {STRINGS.appName[lang]}
            </div>
            <div className="hidden text-[10.5px] text-muted sm:block">
              {STRINGS.tagline[lang]}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSources}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-surface-2"
            title={t("sourcePool", lang)}
          >
            <Globe className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("sources", lang)}</span>
            <span className="rounded-full bg-accent-soft px-1.5 text-[10px] font-bold text-accent">
              {enabledSources}
            </span>
          </button>
          <button
            type="button"
            onClick={onDigest}
            className="hidden items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-surface-2 sm:inline-flex"
          >
            <FileDown className="h-3.5 w-3.5" />
            {t("buildDigest", lang)}
          </button>
          <button
            type="button"
            onClick={onPersonalize}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-ink transition-colors hover:bg-surface-2"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("changeFocus", lang)}</span>
          </button>
          <button
            type="button"
            onClick={onToggleLang}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink transition-colors hover:bg-surface-2"
            title="切换语言 / Switch language"
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === "zh" ? "EN" : "中"}
          </button>
        </div>
      </div>
    </header>
  );
}
