import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { fetchSignals } from "@/lib/data";
import { hasSupabase } from "@/lib/supabase";
import { SIGNAL_TYPE_LABEL, REGION_LABEL } from "@/lib/taxonomy";
import { IngestButton } from "@/components/IngestButton";
import { fmtDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { signals, source } = await fetchSignals();
  const byType = signals.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to signals
      </Link>

      <h1 className="text-2xl font-bold text-ink">Admin · Data backend</h1>
      <p className="mt-1 text-sm text-muted">
        Source:{" "}
        <span className="font-semibold text-ink">
          {source === "supabase" ? "Supabase (live)" : "Bundled seed data"}
        </span>
        {!hasSupabase() && (
          <span className="ml-2 text-amber-600">
            — Supabase not configured. Add env vars + run supabase/schema.sql to go live.
          </span>
        )}
      </p>

      {/* stats */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="card p-4">
          <div className="text-2xl font-bold text-ink">{signals.length}</div>
          <div className="text-xs text-muted">total signals</div>
        </div>
        {Object.entries(byType).map(([ty, n]) => (
          <div key={ty} className="card p-4">
            <div className="text-2xl font-bold text-ink">{n}</div>
            <div className="text-xs text-muted">
              {SIGNAL_TYPE_LABEL[ty as keyof typeof SIGNAL_TYPE_LABEL]?.en ?? ty}
            </div>
          </div>
        ))}
      </div>

      {/* ingestion */}
      <div className="card mt-5 p-5">
        <h2 className="text-base font-semibold text-ink">Manual ingestion</h2>
        <p className="mb-3 mt-1 text-sm text-muted">
          Triggers the AI web-search pipeline (<code>/api/ingest</code>) to pull
          fresh signals into Supabase. Runs automatically daily at 01:00 UTC via
          Vercel Cron. Requires <code>ANTHROPIC_API_KEY</code> and the Supabase
          service role key.
        </p>
        <IngestButton />
      </div>

      {/* table */}
      <div className="card mt-5 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-surface-2 text-xs text-muted">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Title</th>
              <th className="p-3">Org</th>
              <th className="p-3">Region</th>
              <th className="p-3">Date</th>
              <th className="p-3">Imp.</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="p-3">
                  <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium">
                    {SIGNAL_TYPE_LABEL[s.type].en}
                  </span>
                </td>
                <td className="max-w-md p-3">
                  <div className="truncate font-medium text-ink">{s.title_en}</div>
                </td>
                <td className="p-3 text-muted">{s.org ?? "—"}</td>
                <td className="p-3 text-muted">{REGION_LABEL[s.region].en}</td>
                <td className="p-3 text-muted">{fmtDate(s.date, "en")}</td>
                <td className="p-3 font-mono text-muted">{s.importance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
