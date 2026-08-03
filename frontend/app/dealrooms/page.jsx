"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getDealRooms } from "@/lib/services/dealRoomService";
import { Card } from "@/components/ui/card";
import { Handshake } from "lucide-react";

function pickBestDealRoom(dealRooms) {
  if (!Array.isArray(dealRooms) || dealRooms.length === 0) return null;

  // Prefer an active-ish room if status is present.
  // Backend status values live in dealRoom.model/controller; we support common ones.
  const priority = [
    "negotiation",
    "due_diligence",
    "nda_signed",
    "interested",
    "closed",
    "declined",
  ];

  const score = (dr) => {
    const status = dr?.status;
    const idx = priority.indexOf(status);
    return idx === -1 ? 999 : idx;
  };

  return [...dealRooms].sort((a, b) => score(a) - score(b))[0] || null;
}

export default function DealRoomsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dealRooms, setDealRooms] = useState([]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await getDealRooms();
        if (!mounted) return;
        setDealRooms(res || []);

        const best = pickBestDealRoom(res || []);
        const id = best?._id || best?.id;
        if (id) {
          router.replace(`/dealrooms/${id}`);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router]);

  const hasAny = useMemo(() => dealRooms?.length > 0, [dealRooms]);

  return (
    <AppShell title="Deal Rooms" subtitle="Your negotiation workspaces.">
      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--text-muted)]">
          Loading your deal rooms...
        </div>
      ) : hasAny ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--text-muted)]">
          Redirecting to the most relevant deal room...
        </div>
      ) : (
        <Card className="rounded-xl border border-dashed border-[var(--border)] bg-white p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)]">
            <Handshake size={20} className="text-[var(--text-muted)]" />
          </div>
          <p className="mt-3 text-sm font-medium text-[var(--text-main)]">No deal rooms yet</p>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            When a match progresses to a negotiation, a deal room will appear here.
          </p>
        </Card>
      )}
    </AppShell>
  );
}

