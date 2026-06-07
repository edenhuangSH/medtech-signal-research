"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function IngestButton() {
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch(
        `/api/ingest${secret ? `?secret=${encodeURIComponent(secret)}` : ""}`,
        { method: "POST" }
      );
      const data = await res.json();
      setStatus(
        data.ok
          ? `✓ Ingested ${data.ingested ?? 0} signals${data.note ? ` (${data.note})` : ""}`
          : `✗ ${data.reason ?? data.error ?? "failed"}`
      );
    } catch (e) {
      setStatus(`✗ ${String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="password"
        value={secret}
        onChange={(e) => setSecret(e.target.value)}
        placeholder="CRON_SECRET"
        className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <button onClick={run} disabled={loading} className="btn-accent">
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Running…" : "Run ingestion now"}
      </button>
      {status && <span className="text-sm text-muted">{status}</span>}
    </div>
  );
}
