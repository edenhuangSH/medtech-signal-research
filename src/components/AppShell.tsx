"use client";

import { useMemo, useState, useEffect } from "react";
import type { Signal } from "@/lib/types";
import { rankSignals, summarize } from "@/lib/scoring";
import { usePrefs, useSaved } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { SIGNAL_TYPE_LABEL, INTENT_LABEL } from "@/lib/taxonomy";
import { TopBar } from "./TopBar";
import { LensBar } from "./LensBar";
import { FilterBar, type Filters } from "./FilterBar";
import { SignalCard } from "./SignalCard";
import { Onboarding } from "./Onboarding";
import { DigestModal } from "./DigestModal";

const DEFAULT_FILTERS: Filters = {
  types: [],
  region: "all",
  topic: "all",
  search: "",
  sort: "priority",
};

export function AppShell({
  signals,
  source,
}: {
  signals: Signal[];
  source: "supabase" | "seed";
}) {
  const { prefs, update, hydrated, onboarded, completeOnboarding, setOnboarded } =
    usePrefs();
  const { saved, toggle } = useSaved();
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showDigest, setShowDigest] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);

  const lang = prefs.lang;

  // First-visit onboarding
  useEffect(() => {
    if (hydrated && !onboarded) setShowOnboarding(true);
  }, [hydrated, onboarded]);

  // 1. Rank by personalized priority
  const ranked = useMemo(() => rankSignals(signals, prefs), [signals, prefs]);

  // 2. Apply filters + sort
  const visible = useMemo(() => {
    let arr = ranked;
    if (savedOnly) arr = arr.filter((s) => saved.includes(s.signal.id));
    if (filters.types.length)
      arr = arr.filter((s) => filters.types.includes(s.signal.type));
    if (filters.region !== "all")
      arr = arr.filter((s) => s.signal.region === filters.region);
    if (filters.topic !== "all")
      arr = arr.filter((s) => s.signal.topics.includes(filters.topic));
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      arr = arr.filter((s) =>
        [
          s.signal.title_en,
          s.signal.title_zh,
          s.signal.summary_en,
          s.signal.summary_zh,
          s.signal.org ?? "",
          s.signal.target ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }
    if (filters.sort === "recent")
      arr = [...arr].sort(
        (a, b) =>
          new Date(b.signal.date).getTime() - new Date(a.signal.date).getTime()
      );
    else if (filters.sort === "importance")
      arr = [...arr].sort((a, b) => b.signal.importance - a.signal.importance);
    return arr;
  }, [ranked, filters, saved, savedOnly]);

  const stats = useMemo(() => summarize(ranked), [ranked]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        {t("loading", "zh")}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar
        lang={lang}
        onToggleLang={() => update({ lang: lang === "zh" ? "en" : "zh" })}
        onPersonalize={() => setShowOnboarding(true)}
        onDigest={() => setShowDigest(true)}
      />

      <main className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        {/* lens selector */}
        <div className="mb-5">
          <LensBar
            value={prefs.intent}
            onChange={(i) => update({ intent: i })}
            lang={lang}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_220px]">
          {/* main column */}
          <div>
            <div className="mb-4">
              <FilterBar filters={filters} setFilters={setFilters} lang={lang} />
            </div>

            <div className="mb-3 flex items-center justify-between text-xs text-muted">
              <span>
                {visible.length}{" "}
                {lang === "zh" ? "条信号" : "signals"}
                {" · "}
                {INTENT_LABEL[prefs.intent][lang]}
              </span>
              <button
                onClick={() => setSavedOnly((v) => !v)}
                className={`rounded-md px-2 py-1 font-medium transition-colors ${
                  savedOnly ? "bg-ink text-white" : "hover:bg-surface-2"
                }`}
              >
                {t("nav_saved", lang)} ({saved.length})
              </button>
            </div>

            {visible.length === 0 ? (
              <div className="card p-10 text-center text-sm text-muted">
                {t("empty", lang)}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {visible.map((s) => (
                  <SignalCard
                    key={s.signal.id}
                    scored={s}
                    lang={lang}
                    isSaved={saved.includes(s.signal.id)}
                    onToggleSave={() => toggle(s.signal.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* stats sidebar */}
          <aside className="no-print hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <div className="card p-4">
                <div className="text-3xl font-bold text-accent">{stats.high}</div>
                <div className="text-xs text-muted">
                  {lang === "zh" ? "条高优先级信号" : "high-priority signals"}
                </div>
                <div className="mt-3 space-y-1.5 border-t border-border pt-3">
                  {(Object.keys(stats.byType) as (keyof typeof stats.byType)[])
                    .sort((a, b) => stats.byType[b] - stats.byType[a])
                    .map((ty) => (
                      <button
                        key={ty}
                        onClick={() =>
                          setFilters({
                            ...DEFAULT_FILTERS,
                            sort: filters.sort,
                            types: [ty as Filters["types"][number]],
                          })
                        }
                        className="flex w-full items-center justify-between text-xs hover:text-ink"
                      >
                        <span className="text-muted">
                          {SIGNAL_TYPE_LABEL[ty as keyof typeof SIGNAL_TYPE_LABEL][lang]}
                        </span>
                        <span className="font-mono font-semibold text-ink">
                          {stats.byType[ty]}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              <button
                onClick={() => setShowDigest(true)}
                className="btn-accent w-full"
              >
                {t("buildDigest", lang)}
              </button>

              <div className="px-1 text-[10.5px] leading-relaxed text-faint">
                {source === "seed"
                  ? lang === "zh"
                    ? "数据来源:内置精选种子数据。配置 Supabase 后将由 AI 抓取自动更新。"
                    : "Source: bundled seed data. Wire up Supabase to enable automated AI ingestion."
                  : lang === "zh"
                    ? "数据来源:实时数据库。"
                    : "Source: live database."}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Onboarding
        open={showOnboarding}
        initial={prefs}
        onClose={() => {
          setShowOnboarding(false);
          setOnboarded(true);
        }}
        onSave={(p) => {
          completeOnboarding(p);
          setShowOnboarding(false);
        }}
      />

      <DigestModal
        open={showDigest}
        onClose={() => setShowDigest(false)}
        scored={visible}
        lang={lang}
        intent={prefs.intent}
      />
    </div>
  );
}
