"use client";

import { useState } from "react";
import { X, Check, Lock, Link2, Rss, Search, Database, Globe } from "lucide-react";
import type { Lang } from "@/lib/types";
import {
  SOURCES,
  SOURCE_CATEGORY_LABEL,
  isSourceEnabled,
  type Source,
  type SourceCategory,
} from "@/lib/sources";
import { SIGNAL_TYPE_LABEL } from "@/lib/taxonomy";
import type { Connection } from "@/lib/prefs";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Modal } from "./ui";

const METHOD_ICON = { rss: Rss, websearch: Search, api: Database };

const CATEGORY_ORDER: SourceCategory[] = [
  "deal-tracker",
  "vc-firm",
  "accelerator",
  "research",
  "events",
  "china",
  "private",
];

export function SourcesPanel({
  open,
  onClose,
  lang,
  overrides,
  setOverride,
  connections,
  connect,
  disconnect,
  counts,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  overrides: Record<string, boolean>;
  setOverride: (id: string, on: boolean) => void;
  connections: Record<string, Connection>;
  connect: (id: string, value: string) => void;
  disconnect: (id: string) => void;
  counts: Record<string, number>;
}) {
  const connectedIds = new Set(Object.keys(connections));
  const [connecting, setConnecting] = useState<string | null>(null);
  const [credInput, setCredInput] = useState("");

  const enabledCount = SOURCES.filter((s) =>
    isSourceEnabled(s, overrides, connectedIds)
  ).length;

  const bulk = (on: boolean) => {
    for (const s of SOURCES) {
      if (s.requiresAuth && !connectedIds.has(s.id)) continue;
      setOverride(s.id, on);
    }
  };

  function SourceRow({ s }: { s: Source }) {
    const connected = connectedIds.has(s.id);
    const enabled = isSourceEnabled(s, overrides, connectedIds);
    const locked = s.requiresAuth && !connected;
    const MethodIcon = METHOD_ICON[s.method];
    const n = counts[s.id] ?? 0;

    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border p-3 transition-colors",
          enabled ? "border-accent/40 bg-accent-soft/20" : "border-border bg-surface"
        )}
      >
        {/* toggle */}
        <button
          type="button"
          disabled={locked}
          onClick={() => setOverride(s.id, !enabled)}
          className={cn(
            "mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
            enabled ? "bg-accent" : "bg-surface-2 border border-border",
            locked && "cursor-not-allowed opacity-40"
          )}
          title={locked ? t("needsConnection", lang) : undefined}
        >
          <span
            className={cn(
              "h-4 w-4 rounded-full bg-white shadow transition-transform",
              enabled && "translate-x-4"
            )}
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-ink">{s.name}</span>
            {locked && <Lock className="h-3 w-3 text-faint" />}
            {n > 0 && (
              <span className="rounded-full bg-surface-2 px-1.5 text-[10px] font-medium text-muted">
                {n} {t("poolStatus", lang)}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[11px] text-muted">
            {lang === "zh" ? s.blurb_zh : s.blurb_en}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {s.produces.map((p) => (
              <span
                key={p}
                className="rounded bg-surface-2 px-1.5 py-0.5 text-[9.5px] font-medium text-muted"
              >
                {SIGNAL_TYPE_LABEL[p][lang]}
              </span>
            ))}
            <span className="ml-1 inline-flex items-center gap-1 text-[10px] text-faint">
              <MethodIcon className="h-2.5 w-2.5" />
              {s.method}
            </span>
          </div>

          {/* connection control for gated sources */}
          {s.requiresAuth &&
            (connecting === s.id ? (
              <div className="mt-2 flex flex-col gap-1.5">
                <input
                  autoFocus
                  type="password"
                  value={credInput}
                  onChange={(e) => setCredInput(e.target.value)}
                  placeholder={s.authLabel ?? t("enterCredential", lang)}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs outline-none focus:border-accent"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (credInput.trim()) {
                        connect(s.id, credInput.trim());
                        setOverride(s.id, true);
                      }
                      setConnecting(null);
                      setCredInput("");
                    }}
                    className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-white"
                  >
                    {t("connect", lang)}
                  </button>
                  <button
                    onClick={() => {
                      setConnecting(null);
                      setCredInput("");
                    }}
                    className="text-[11px] text-muted"
                  >
                    {lang === "zh" ? "取消" : "Cancel"}
                  </button>
                </div>
                <span className="text-[10px] text-faint">{t("credentialNote", lang)}</span>
              </div>
            ) : connected ? (
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent">
                  <Check className="h-3 w-3" /> {t("connected", lang)}
                </span>
                <button
                  onClick={() => disconnect(s.id)}
                  className="text-[11px] text-muted hover:text-ink"
                >
                  {t("disconnect", lang)}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConnecting(s.id)}
                className="mt-1.5 inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-ink hover:bg-surface-2"
              >
                <Link2 className="h-3 w-3" /> {t("connect", lang)}
              </button>
            ))}
        </div>
      </div>
    );
  }

  return (
    <Modal open={open} onClose={onClose} wide>
      <div className="flex items-start justify-between border-b border-border p-5">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Globe className="h-5 w-5 text-accent" />
            {t("sourcePool", lang)}
          </h2>
          <p className="mt-1 max-w-md text-[13px] text-muted">
            {t("sourcePoolSub", lang)}
          </p>
        </div>
        <button onClick={onClose} className="text-faint hover:text-ink">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center justify-between border-b border-border px-5 py-2.5">
        <span className="text-xs font-medium text-muted">
          {enabledCount} {t("sourcesEnabled", lang)} · {SOURCES.length} total
        </span>
        <div className="flex gap-2">
          <button onClick={() => bulk(true)} className="text-xs font-medium text-accent">
            {t("enableAll", lang)}
          </button>
          <button onClick={() => bulk(false)} className="text-xs font-medium text-muted">
            {t("disableAll", lang)}
          </button>
        </div>
      </div>

      <div className="max-h-[60vh] space-y-5 overflow-y-auto p-5">
        {CATEGORY_ORDER.map((cat) => {
          const items = SOURCES.filter((s) => s.category === cat && s.id !== "other-web");
          if (!items.length) return null;
          return (
            <section key={cat}>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-faint">
                {SOURCE_CATEGORY_LABEL[cat][lang]}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {items.map((s) => (
                  <SourceRow key={s.id} s={s} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="flex justify-end border-t border-border p-4">
        <button onClick={onClose} className="btn-accent">
          {lang === "zh" ? "完成" : "Done"}
        </button>
      </div>
    </Modal>
  );
}
