import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fmtDate(iso: string, lang: "en" | "zh"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(lang === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function relativeDays(iso: string, lang: "en" | "zh"): string | null {
  const d = new Date(iso).getTime();
  if (Number.isNaN(d)) return null;
  const days = Math.round((d - Date.now()) / (1000 * 60 * 60 * 24));
  if (days === 0) return lang === "zh" ? "今天" : "today";
  if (days > 0)
    return lang === "zh" ? `${days}天后` : `in ${days}d`;
  return lang === "zh" ? `${-days}天前` : `${-days}d ago`;
}

export function fmtAmount(usd: number | null, fallback: string | null): string {
  if (usd == null) return fallback ?? "—";
  if (usd >= 1e9) return `$${(usd / 1e9).toFixed(usd >= 1e10 ? 0 : 1)}B`;
  if (usd >= 1e6) return `$${(usd / 1e6).toFixed(0)}M`;
  if (usd >= 1e3) return `$${(usd / 1e3).toFixed(0)}K`;
  return `$${usd}`;
}
