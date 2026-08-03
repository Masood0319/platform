"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getMatches } from "@/lib/services/matchService";

function MatchesSkeleton() {
  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <div className="h-4 w-40 rounded bg-[var(--surface)]" />
          <div className="mt-3 h-3 w-56 rounded bg-[var(--surface)]" />
          <div className="mt-4 h-9 w-full rounded bg-[var(--surface)]" />
        </div>
      ))}
    </section>
  );
}

export default function MatchesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await getMatches();
        if (mounted) setMatches(res);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    const c = { active: 0, closed: 0, declined: 0 };
    for (const m of matches) c[m.status] = (c[m.status] || 0) + 1;
    return c;
  }, [matches]);

  return (
    <AppShell title="Matches" subtitle="Mutual matches and ongoing dealrooms.">
      {isLoading ? (
        <MatchesSkeleton />
      ) : matches.length ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <p className="text-xs text-[var(--text-muted)]">Active</p>
              <p className="mt-1 text-xl font-semibold text-[var(--text-main)]">{counts.active}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <p className="text-xs text-[var(--text-muted)]">Closed</p>
              <p className="mt-1 text-xl font-semibold text-[var(--text-main)]">{counts.closed}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <p className="text-xs text-[var(--text-muted)]">Declined</p>
              <p className="mt-1 text-xl font-semibold text-[var(--text-main)]">{counts.declined}</p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <p className="text-xs text-[var(--text-muted)]">Total</p>
              <p className="mt-1 text-xl font-semibold text-[var(--text-main)]">{matches.length}</p>
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((m) => (
              <div
                key={m._id}
                className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold text-[var(--text-main)]">
                      {m.startup?.name || "Startup"}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {m.investorId?.name ? `Investor: ${m.investorId.name}` : ""}
                      {m.founderId?.name ? ` · Founder: ${m.founderId.name}` : ""}
                    </p>
                  </div>
                  <Badge>{m.status === "active" ? "Matched" : m.status}</Badge>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/matches/${m._id}`}
                    className="inline-flex items-center rounded-md border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--text-main)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--surface)]"
                  >
                    View match
                  </Link>
                </div>
              </div>
            ))}
          </section>
        </>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--text-muted)]">
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)]">
            <span className="text-lg">🤝</span>
          </div>
          <p className="font-medium text-[var(--text-main)]">No matches yet</p>
          <p>When mutual interest happens, you’ll see it here.</p>
        </div>
      )}
    </AppShell>
  );
}

