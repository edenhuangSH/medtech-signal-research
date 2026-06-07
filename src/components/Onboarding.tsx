"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { Audience, Expertise, Region, UserPrefs } from "@/lib/types";
import {
  AUDIENCE_LABEL,
  EXPERTISE_LABEL,
  REGION_LABEL,
  FOCUS_REGIONS,
  TOPICS,
} from "@/lib/taxonomy";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Modal } from "./ui";

const AUDIENCES: Audience[] = [
  "founder",
  "investor",
  "professional",
  "student",
  "media",
  "enthusiast",
];
const EXPERTISES: Expertise[] = ["beginner", "intermediate", "expert"];

export function Onboarding({
  open,
  initial,
  onClose,
  onSave,
}: {
  open: boolean;
  initial: UserPrefs;
  onClose: () => void;
  onSave: (p: UserPrefs) => void;
}) {
  const lang = initial.lang;
  const [audiences, setAudiences] = useState<Audience[]>(initial.audiences);
  const [expertise, setExpertise] = useState<Expertise>(initial.expertise);
  const [regions, setRegions] = useState<Region[]>(initial.regions);
  const [topics, setTopics] = useState<string[]>(initial.topics);

  const toggle = <T,>(arr: T[], v: T, set: (a: T[]) => void) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const save = () =>
    onSave({
      ...initial,
      audiences: audiences.length ? audiences : ["founder"],
      expertise,
      regions: regions.length ? regions : ["global"],
      topics,
    });

  return (
    <Modal open={open} onClose={onClose} wide>
      <div className="flex items-start justify-between border-b border-border p-5">
        <div>
          <h2 className="text-lg font-bold text-ink">{t("ob_title", lang)}</h2>
          <p className="mt-1 text-[13px] text-muted">{t("ob_sub", lang)}</p>
        </div>
        <button onClick={onClose} className="text-faint hover:text-ink">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="max-h-[60vh] space-y-6 overflow-y-auto p-5">
        {/* audiences */}
        <section>
          <h3 className="mb-2.5 text-[13px] font-semibold text-ink">
            {t("ob_who", lang)}
          </h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {AUDIENCES.map((a) => {
              const on = audiences.includes(a);
              const m = AUDIENCE_LABEL[a];
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggle(audiences, a, setAudiences)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                    on ? "border-accent bg-accent-soft/40" : "border-border hover:border-faint"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      on ? "border-accent bg-accent text-white" : "border-border"
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold text-ink">
                      {m[lang]}
                    </span>
                    <span className="block text-[11px] text-muted">
                      {lang === "zh" ? m.blurb_zh : m.blurb_en}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* expertise */}
        <section>
          <h3 className="mb-2.5 text-[13px] font-semibold text-ink">
            {t("ob_depth", lang)}
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {EXPERTISES.map((e) => {
              const on = expertise === e;
              const m = EXPERTISE_LABEL[e];
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => setExpertise(e)}
                  className={cn(
                    "rounded-xl border p-3 text-center transition-all",
                    on ? "border-accent bg-accent-soft/40" : "border-border hover:border-faint"
                  )}
                >
                  <span className="block text-[13px] font-semibold text-ink">
                    {m[lang]}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-muted">
                    {lang === "zh" ? m.blurb_zh : m.blurb_en}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* regions */}
        <section>
          <h3 className="mb-2.5 text-[13px] font-semibold text-ink">
            {t("ob_regions", lang)}
          </h3>
          <div className="flex flex-wrap gap-2">
            {[...FOCUS_REGIONS, "global" as Region].map((r) => {
              const on = regions.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggle(regions, r, setRegions)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                    on
                      ? "border-accent bg-accent text-white"
                      : "border-border text-muted hover:border-faint"
                  )}
                >
                  {REGION_LABEL[r][lang]}
                </button>
              );
            })}
          </div>
        </section>

        {/* topics */}
        <section>
          <h3 className="mb-2.5 text-[13px] font-semibold text-ink">
            {t("ob_topics", lang)}
          </h3>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((tp) => {
              const on = topics.includes(tp.key);
              return (
                <button
                  key={tp.key}
                  type="button"
                  onClick={() => toggle(topics, tp.key, setTopics)}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all",
                    on
                      ? "border-accent bg-accent text-white"
                      : "border-border text-muted hover:border-faint"
                  )}
                >
                  {tp[lang]}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-border p-4">
        <button onClick={onClose} className="btn-ghost">
          {t("ob_skip", lang)}
        </button>
        <button onClick={save} className="btn-accent">
          {t("ob_done", lang)}
        </button>
      </div>
    </Modal>
  );
}
