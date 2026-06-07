"use client";

import {
  LayoutGrid,
  TrendingUp,
  Sparkles,
  FileText,
  Calendar,
  type LucideIcon,
} from "lucide-react";
import type { Intent, Lang } from "@/lib/types";
import { INTENT_LABEL } from "@/lib/taxonomy";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const ICONS: Record<Intent, LucideIcon> = {
  overview: LayoutGrid,
  deals: TrendingUp,
  innovation: Sparkles,
  research: FileText,
  networking: Calendar,
};

const ORDER: Intent[] = ["overview", "deals", "innovation", "research", "networking"];

export function LensBar({
  value,
  onChange,
  lang,
}: {
  value: Intent;
  onChange: (i: Intent) => void;
  lang: Lang;
}) {
  return (
    <div>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">
        {t("yourLens", lang)}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {ORDER.map((intent) => {
          const Icon = ICONS[intent];
          const active = value === intent;
          const meta = INTENT_LABEL[intent];
          return (
            <button
              key={intent}
              type="button"
              onClick={() => onChange(intent)}
              className={cn(
                "group flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all",
                active
                  ? "border-accent bg-accent-soft/50 shadow-sm"
                  : "border-border bg-surface hover:border-faint"
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
                  active ? "bg-accent text-white" : "bg-surface-2 text-muted"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span
                className={cn(
                  "text-[13px] font-semibold",
                  active ? "text-ink" : "text-ink"
                )}
              >
                {meta[lang]}
              </span>
              <span className="text-[10.5px] leading-tight text-muted">
                {lang === "zh" ? meta.blurb_zh : meta.blurb_en}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
