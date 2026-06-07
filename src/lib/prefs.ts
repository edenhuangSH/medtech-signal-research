"use client";

import { useEffect, useState, useCallback } from "react";
import { DEFAULT_PREFS, type UserPrefs } from "./types";

const KEY = "helix.prefs.v1";
const ONBOARDED_KEY = "helix.onboarded.v1";

export function loadPrefs(): UserPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Reactive prefs hook backed by localStorage. */
export function usePrefs() {
  const [prefs, setPrefs] = useState<UserPrefs>(DEFAULT_PREFS);
  const [hydrated, setHydrated] = useState(false);
  const [onboarded, setOnboarded] = useState(true);

  useEffect(() => {
    setPrefs(loadPrefs());
    setOnboarded(localStorage.getItem(ONBOARDED_KEY) === "1");
    setHydrated(true);
  }, []);

  const update = useCallback((patch: Partial<UserPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const completeOnboarding = useCallback((next: UserPrefs) => {
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {}
    setPrefs(next);
    setOnboarded(true);
  }, []);

  return { prefs, update, hydrated, onboarded, setOnboarded, completeOnboarding };
}

// ── Saved signals (bookmarks) ────────────────────────────────────────────────
const SAVED_KEY = "helix.saved.v1";

export function useSaved() {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) setSaved(JSON.parse(raw));
    } catch {}
  }, []);
  const toggle = useCallback((id: string) => {
    setSaved((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  return { saved, toggle };
}
