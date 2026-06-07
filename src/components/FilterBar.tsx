"use client";

import { Search, X } from "lucide-react";
import type { Lang, Region, SignalType } from "@/lib/types";
import { SIGNAL_TYPE_LABEL, REGION_LABEL, FOCUS_REGIONS, TOPICS } from "@/lib/taxonomy";
import { t } from "@/lib/i18n";
import { Pill, Segmented } from "./ui";

export type SortKey = "priority" | "recent" | "importance";

export interface Filters {
  types: SignalType[];
  region: Region | "all";
  topic: string | "all";
  search: string;
  sort: SortKey;
}

const TYPE_ORDER: SignalType[] = ["vc", "mna", "cohort", "report", "event"];

export function FilterBar({
  filters,
  setFilters,
  lang,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  lang: Lang;
}) {
  const toggleType = (ty: SignalType) => {
    const has = filters.types.includes(ty);
    setFilters({
      ...filters,
      types: has ? filters.types.filter((x) => x !== ty) : [...filters.types, ty],
    });
  };

  const active =
    filters.types.length > 0 ||
    filters.region !== "all" ||
    filters.topic !== "all" ||
    filters.search.length > 0;

  return (
    <div className="space-y-3">
      {/* search + sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder={t("search", lang)}
            className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-faint focus:border-accent"
          />
        </div>
        <Segmented<SortKey>
          value={filters.sort}
          onChange={(v) => setFilters({ ...filters, sort: v })}
          options={[
            { value: "priority", label: t("sortPriority", lang) },
            { value: "recent", label: t("sortRecent", lang) },
            { value: "importance", label: t("sortImportance", lang) },
          ]}
        />
        {active && (
          <button
            type="button"
            onClick={() =>
              setFilters({
                types: [],
                region: "all",
                topic: "all",
                search: "",
                sort: filters.sort,
              })
            }
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-muted hover:bg-surface-2 hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
            {t("reset", lang)}
          </button>
        )}
      </div>

      {/* type pills */}
      <div className="flex flex-wrap gap-1.5">
        {TYPE_ORDER.map((ty) => (
          <Pill
            key={ty}
            active={filters.types.includes(ty)}
            onClick={() => toggleType(ty)}
          >
            {SIGNAL_TYPE_LABEL[ty][lang]}
          </Pill>
        ))}
      </div>

      {/* region + topic selects */}
      <div className="flex flex-wrap gap-2">
        <select
          value={filters.region}
          onChange={(e) =>
            setFilters({ ...filters, region: e.target.value as Region | "all" })
          }
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted outline-none focus:border-accent"
        >
          <option value="all">{t("allRegions", lang)}</option>
          {FOCUS_REGIONS.map((r) => (
            <option key={r} value={r}>
              {REGION_LABEL[r][lang]}
            </option>
          ))}
          <option value="global">{REGION_LABEL.global[lang]}</option>
          <option value="other">{REGION_LABEL.other[lang]}</option>
        </select>

        <select
          value={filters.topic}
          onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted outline-none focus:border-accent"
        >
          <option value="all">{t("allTopics", lang)}</option>
          {TOPICS.map((tp) => (
            <option key={tp.key} value={tp.key}>
              {tp[lang]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
