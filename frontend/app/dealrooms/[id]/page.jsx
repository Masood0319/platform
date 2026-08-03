"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import {
  patchDealRoomStatus,
  getDealRoomById,
} from "@/lib/services/dealRoomService";

const STATUS_FLOW = ["active", "due_diligence", "negotiation", "closed"];

// Workflow labels mapped onto existing backend statuses.
// Documents Shared + NDA Signed both correspond to backend `due_diligence`.
const WORKFLOW_MILESTONES = [
  {
    key: "documents_shared",
    label: "Documents Shared",
    status: "due_diligence",
  },
  { key: "nda_signed", label: "NDA Signed", status: "due_diligence" },
  { key: "due_diligence", label: "Due Diligence", status: "due_diligence" },
  { key: "negotiation", label: "Negotiation", status: "negotiation" },
  { key: "deal_closed", label: "Deal Closed", status: "closed" },
];

function toLabel(status) {
  return status
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function Timeline({ activityLog = [] }) {
  if (!activityLog.length) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-white p-5 text-sm text-[var(--text-muted)]">
        No activity yet.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-5">
      <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
        Activity timeline
      </p>
      <div className="mt-3 space-y-3">
        {activityLog.map((a, i) => (
          <div key={i} className="border-t border-[var(--border)] pt-3">
            <p className="text-sm font-semibold text-[var(--text-main)]">
              {a.type}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DealRoomPage() {
  const params = useParams();
  const dealRoomId = params?.id;

  const [isLoading, setIsLoading] = useState(true);
  const [dealRoom, setDealRoom] = useState(null);

  const [nextStatus, setNextStatus] = useState("");
  const [isAdvancing, setIsAdvancing] = useState(false);

  const currentStatusIndex = STATUS_FLOW.indexOf(dealRoom?.status);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const dr = await getDealRoomById(dealRoomId);
        if (mounted) setDealRoom(dr);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dealRoomId]);

  const currentStatus = dealRoom?.status;

  useEffect(() => {
    if (!dealRoom?.status) return;
    const idx = STATUS_FLOW.indexOf(dealRoom.status);
    const candidate = STATUS_FLOW[idx + 1] || "";
    setNextStatus(candidate);
  }, [dealRoom?.status]);

  async function handleAdvance() {
    if (!nextStatus) return;
    if (isAdvancing) return;
    setIsAdvancing(true);
    try {
      const updated = await patchDealRoomStatus(dealRoomId, nextStatus);
      setDealRoom(updated);
    } finally {
      setIsAdvancing(false);
    }
  }

  return (
    <AppShell
      title="Deal Room"
      subtitle="A lightweight workspace for mutual matches."
    >
      {isLoading ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-5">
          Loading...
        </div>
      ) : dealRoom ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-[var(--border)] bg-white p-5 lg:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-[var(--text-main)]">
                  {dealRoom.startup?.name || "Startup"}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Match workspace
                </p>
              </div>
              <Badge>{toLabel(dealRoom.status)}</Badge>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-[var(--text-muted)]">Founder</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                  {dealRoom.founderId?.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Investor</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                  {dealRoom.investorId?.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Startup</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                  {dealRoom.startupId?.name || dealRoom.startup?.name}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-muted)]">Created</p>
                <p className="mt-1 text-sm font-semibold text-[var(--text-main)]">
                  {dealRoom.createdAt
                    ? new Date(dealRoom.createdAt).toLocaleDateString()
                    : null}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
                Milestones
              </p>

              <div className="mt-3 space-y-2">
                {WORKFLOW_MILESTONES.map((m) => {
                  const currentIdx = STATUS_FLOW.indexOf(currentStatus);
                  const milestoneIdx = STATUS_FLOW.indexOf(m.status);
                  const done =
                    milestoneIdx !== -1 && milestoneIdx <= currentIdx;

                  return (
                    <div
                      key={m.key}
                      className={
                        done
                          ? "flex items-center justify-between rounded-md border border-[var(--border)] bg-white px-3 py-2"
                          : "flex items-center justify-between rounded-md border border-dashed border-[var(--border)] bg-white px-3 py-2"
                      }
                    >
                      <p
                        className={
                          done
                            ? "text-sm font-semibold text-[var(--text-main)]"
                            : "text-sm text-[var(--text-muted)]"
                        }
                      >
                        {m.label}
                      </p>
                      <Badge
                        className={
                          done
                            ? "bg-[var(--primary)] text-white"
                            : "bg-white text-[var(--text-muted)] border"
                        }
                      >
                        {done ? "Done" : "Pending"}
                      </Badge>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4">
                <button
                  onClick={handleAdvance}
                  disabled={!nextStatus || isAdvancing}
                  className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isAdvancing
                    ? "Updating..."
                    : nextStatus
                      ? `Advance to ${toLabel(nextStatus)}`
                      : "End"}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Timeline activityLog={dealRoom.activityLog || []} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--text-muted)]">
          Deal room not found.
        </div>
      )}
    </AppShell>
  );
}
