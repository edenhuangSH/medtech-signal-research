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

// ── Connections (BYO credentials for gated sources) ──────────────────────────
// Stored locally for the MVP. Production: move to Supabase, encrypted at rest,
// per-user, server-side only — never exposed to the client bundle. The shape is
// designed for that migration (value is treated as a secret).
const CONN_KEY = "helix.connections.v1";

export interface Connection {
  sourceId: string;
  /** The credential (API key / token / cookie). Secret. */
  value: string;
  addedAt: string;
}

export function useConnections() {
  const [connections, setConnections] = useState<Record<string, Connection>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CONN_KEY);
      if (raw) setConnections(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (next: Record<string, Connection>) => {
    try {
      localStorage.setItem(CONN_KEY, JSON.stringify(next));
    } catch {}
    setConnections(next);
  };

  const connect = useCallback((sourceId: string, value: string) => {
    setConnections((prev) => {
      const next = {
        ...prev,
        [sourceId]: { sourceId, value, addedAt: new Date().toISOString() },
      };
      try {
        localStorage.setItem(CONN_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const disconnect = useCallback((sourceId: string) => {
    setConnections((prev) => {
      const next = { ...prev };
      delete next[sourceId];
      try {
        localStorage.setItem(CONN_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { connections, connect, disconnect };
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
