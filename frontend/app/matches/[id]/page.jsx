"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { getMatchById } from "@/lib/services/matchService";
import { getDealRooms } from "@/lib/services/dealRoomService";

function DetailRow({ label, value }) {

  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">{value}</p>
    </div>
  );
}

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = params?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [dealRoom, setDealRoom] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mRes = await getMatchById(matchId);
        if (mounted) setMatch(mRes);

        const rooms = await getDealRooms();
        const found = rooms.find(
          (r) => String(r.matchId?._id || r.matchId) === String(matchId)
        );
        if (mounted) setDealRoom(found || null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [matchId]);


  return (
    <AppShell title="Match" subtitle="Mutual match details.">
      {isLoading ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-5">Loading...</div>
      ) : match ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-white p-5 lg:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-[var(--text-main)]">
                  {match.startup?.name || "Startup"}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Match between founder and investor.
                </p>
              </div>
              <Badge>{match.status === "active" ? "Matched" : match.status}</Badge>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <DetailRow label="Founder" value={match.founderId?.name} />
              <DetailRow label="Investor" value={match.investorId?.name} />
              <DetailRow label="Startup" value={match.startup?.name} />
              <DetailRow label="Created" value={match.createdAt ? new Date(match.createdAt).toLocaleDateString() : null} />
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-white p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">Next</p>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Continue in the deal room for this match.</p>
            <div className="mt-4">
              <Link
                href={dealRoom? `/dealrooms/${dealRoom._id}` : "#"}
                className="inline-flex w-full items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
              >
                {dealRoom ? "Open Deal Room" : "Deal Room loading..."}
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--text-muted)]">
          Match not found.
        </div>
      )}
    </AppShell>
  );
}

