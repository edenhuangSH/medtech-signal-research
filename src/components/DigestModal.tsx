"use client";

import { useState } from "react";
import { X, Printer, Sparkles, Copy, Check } from "lucide-react";
import type { ScoredSignal } from "@/lib/scoring";
import type { Lang } from "@/lib/types";
import { SIGNAL_TYPE_LABEL, REGION_LABEL, INTENT_LABEL } from "@/lib/taxonomy";
import { t } from "@/lib/i18n";
import { fmtDate, fmtAmount } from "@/lib/utils";
import { Modal } from "./ui";
import type { Intent } from "@/lib/types";

export function DigestModal({
  open,
  onClose,
  scored,
  lang,
  intent,
}: {
  open: boolean;
  onClose: () => void;
  scored: ScoredSignal[];
  lang: Lang;
  intent: Intent;
}) {
  const [count, setCount] = useState(10);
  const [exec, setExec] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const top = scored.slice(0, count);

  async function genExec() {
    setLoading(true);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "digest",
          lang,
          signals: top.map((s) => ({
            type: s.signal.type,
            title: lang === "zh" ? s.signal.title_zh : s.signal.title_en,
            summary: lang === "zh" ? s.signal.summary_zh : s.signal.summary_en,
            org: s.signal.org,
            amount: s.signal.amount_display,
          })),
        }),
      });
      const data = await res.json();
      setExec(data.digest ?? null);
    } catch {
      setExec(null);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  const today = fmtDate(new Date().toISOString(), lang);

  return (
    <Modal open={open} onClose={onClose} wide>
      <div className="no-print flex items-center justify-between border-b border-border p-4">
        <h2 className="text-base font-bold text-ink">{t("digestTitle", lang)}</h2>
        <div className="flex items-center gap-2">
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs"
          >
            {[5, 10, 15, 20].map((n) => (
              <option key={n} value={n}>
                {t("topN", lang)}: {n}
              </option>
            ))}
          </select>
          <button onClick={copyLink} className="btn-ghost text-xs">
            {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? t("linkCopied", lang) : t("copyLink", lang)}
          </button>
          <button onClick={() => window.print()} className="btn-primary text-xs">
            <Printer className="h-3.5 w-3.5" />
            {t("exportPdf", lang)}
          </button>
          <button onClick={onClose} className="text-faint hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Printable content */}
      <div className="print-page max-h-[70vh] overflow-y-auto p-6">
        <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-accent">
          Helix Signal · {INTENT_LABEL[intent][lang]}
        </div>
        <h1 className="text-2xl font-bold text-ink">{t("digestTitle", lang)}</h1>
        <p className="mt-1 text-xs text-muted">
          {today} · {top.length} {lang === "zh" ? "条优先信号" : "priority signals"}
        </p>

        {/* exec summary */}
        <div className="mt-4 rounded-xl border border-accent/20 bg-accent-soft/30 p-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              {lang === "zh" ? "AI 执行摘要" : "AI Executive Summary"}
            </span>
            {!exec && (
              <button
                onClick={genExec}
                disabled={loading}
                className="no-print rounded-md bg-accent px-2.5 py-1 text-[11px] font-medium text-white disabled:opacity-50"
              >
                {loading ? t("generating", lang) : (lang === "zh" ? "生成" : "Generate")}
              </button>
            )}
          </div>
          {exec ? (
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">{exec}</p>
          ) : (
            <p className="text-[12.5px] text-muted">
              {lang === "zh"
                ? "点击「生成」用 AI 将下方信号浓缩成一段高管摘要(需配置 ANTHROPIC_API_KEY)。"
                : "Click Generate to distill the signals below into an executive brief (requires ANTHROPIC_API_KEY)."}
            </p>
          )}
        </div>

        {/* ranked list */}
        <ol className="mt-5 space-y-3">
          {top.map((s, i) => (
            <li
              key={s.signal.id}
              className="print-break flex gap-3 border-b border-border pb-3"
            >
              <span className="mt-0.5 font-mono text-sm font-bold text-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-muted">
                    {SIGNAL_TYPE_LABEL[s.signal.type][lang]}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-accent">
                    {s.score}
                  </span>
                  {s.signal.amount_usd && (
                    <span className="text-[11px] font-semibold text-ink">
                      {fmtAmount(s.signal.amount_usd, s.signal.amount_display)}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[14px] font-semibold leading-snug text-ink">
                  {lang === "zh" ? s.signal.title_zh : s.signal.title_en}
                </div>
                <div className="mt-0.5 text-[11px] text-muted">
                  {s.signal.org ? `${s.signal.org} · ` : ""}
                  {REGION_LABEL[s.signal.region][lang]} · {fmtDate(s.signal.date, lang)}
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-muted">
                  {lang === "zh" ? s.signal.summary_zh : s.signal.summary_en}
                </p>
                {s.signal.source_url && (
                  <a
                    href={s.signal.source_url}
                    className="text-[10.5px] text-accent underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.signal.source_url}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-4 text-center text-[10px] text-faint">
          {lang === "zh"
            ? "由 Helix Signal 生成 · 优先级根据你的关注角度与画像计算"
            : "Generated by Helix Signal · Priority computed from your lens & profile"}
        </p>
      </div>
    </Modal>
  );
}
