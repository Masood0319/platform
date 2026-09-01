"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/components/providers/UserProvider";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  patchDealRoomStatus,
  getDealRoomById,
  proposeOrConfirmClose,
  updateChecklistItem,
} from "@/lib/services/dealRoomService";

// "closed" is deliberately NOT part of the simple linear advance flow -
// closing requires a proposed amount and mutual confirmation from both
// participants (see CloseDealPanel below), not a one-click status bump.
const STATUS_FLOW = ["interested", "nda_signed", "due_diligence"];

const WORKFLOW_MILESTONES = [
  { key: "interested", label: "Interested", status: "interested" },
  { key: "nda_signed", label: "NDA Signed", status: "nda_signed" },
  { key: "due_diligence", label: "Due Diligence", status: "due_diligence" },
  { key: "deal_closed", label: "Deal Closed", status: "closed" },
];

function toLabel(status) {
  return status
    .split("_")
    .map((p) => (p.toLowerCase() === "nda" ? "NDA" : p.charAt(0).toUpperCase() + p.slice(1)))
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
        {[...activityLog].reverse().map((a, i) => (
          <div key={i} className="border-t border-[var(--border)] pt-3">
            <p className="text-sm font-semibold text-[var(--text-main)]">
              {a.action}
            </p>
            {a.description && (
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">{a.description}</p>
            )}
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {a.timestamp ? new Date(a.timestamp).toLocaleString() : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Handles proposing a closing amount, waiting for the other party, and
// confirming a proposal that was already made - matches the spec's
// "Mutual confirmation of closed amount ... Confirm & Generate Invoice".
function CloseDealPanel({ dealRoom, myUserId, onUpdated }) {
  const proposal = dealRoom.closeProposal;
  const proposedByMe = proposal && String(proposal.proposedBy) === String(myUserId);
  const feePercentage = dealRoom.feePercentage ?? 3;

  const [amount, setAmount] = useState(proposal?.amount ? String(proposal.amount) : "");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (proposal?.amount) setAmount(String(proposal.amount));
  }, [proposal?.amount]);

  const numericAmount = Number(amount) || 0;
  const feePreview = (numericAmount * feePercentage) / 100;

  async function handleSubmit() {
    if (!numericAmount || numericAmount <= 0) {
      showToast("Enter a valid amount first");
      return;
    }
    setSubmitting(true);
    try {
      const result = await proposeOrConfirmClose(dealRoom._id || dealRoom.id, numericAmount);
      if (result?.dealRoom) {
        // Confirmed - deal is now actually closed.
        onUpdated(result.dealRoom);
        showToast(`Deal closed! Success fee: $${result.feeAmount.toLocaleString()}`);
      } else {
        // Still pending the other party's confirmation.
        onUpdated(result);
        showToast(proposedByMe ? "Proposal updated" : "Proposed - waiting for confirmation");
      }
    } catch (error) {
      showToast(error.message || "Failed to update closing amount");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-sm font-semibold text-[var(--text-main)]">Close this deal</p>

      {proposal && !proposedByMe && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          The other party proposed <span className="font-semibold">${proposal.amount.toLocaleString()}</span>.
          Confirm below to finalize, or propose a different amount.
        </p>
      )}
      {proposal && proposedByMe && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          You proposed <span className="font-semibold">${proposal.amount.toLocaleString()}</span> - waiting for
          the other party to confirm.
        </p>
      )}
      {!proposal && (
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Enter the final investment amount. The other party will need to confirm before the deal actually closes.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className="text-xs text-[var(--text-muted)]">Investment amount ($)</label>
          <Input
            type="number"
            min="0"
            step="1000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 250000"
          />
        </div>
        <div className="text-sm text-[var(--text-muted)]">
          <p>Success fee ({feePercentage}%)</p>
          <p className="font-semibold text-[var(--text-main)]">${feePreview.toLocaleString()}</p>
        </div>
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? "Saving..."
            : proposal && !proposedByMe
              ? "Confirm & Generate Invoice"
              : proposal
                ? "Update Proposal"
                : "Propose Closing"}
        </Button>
      </div>
    </div>
  );
}

const CHECKLIST_ITEMS = [
  { key: "financials", label: "Financials" },
  { key: "capTable", label: "Cap Table" },
  { key: "legalDocuments", label: "Legal Documents" },
  { key: "teamBackgrounds", label: "Team Backgrounds" },
];

function DueDiligenceChecklist({ dealRoom, onUpdated }) {
  const [busyItem, setBusyItem] = useState(null);
  const checklist = dealRoom.dueDiligenceChecklist || {};
  const completedCount = CHECKLIST_ITEMS.filter((i) => checklist[i.key]?.completed).length;

  async function toggle(item, current) {
    if (busyItem) return;
    setBusyItem(item);
    try {
      const updated = await updateChecklistItem(dealRoom._id || dealRoom.id, item, !current);
      onUpdated(updated);
    } catch (error) {
      showToast(error.message || "Failed to update checklist");
    } finally {
      setBusyItem(null);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
          Due diligence checklist
        </p>
        <span className="text-xs text-[var(--text-muted)]">
          {completedCount}/{CHECKLIST_ITEMS.length}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {CHECKLIST_ITEMS.map((i) => {
          const entry = checklist[i.key];
          const completed = !!entry?.completed;
          return (
            <button
              key={i.key}
              type="button"
              onClick={() => toggle(i.key, completed)}
              disabled={busyItem === i.key}
              className="flex w-full items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2 text-left text-sm hover:bg-[var(--surface)] disabled:opacity-50"
            >
              <span
                className={cn(
                  "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border",
                  completed
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)]"
                )}
              >
                {completed && <Check size={12} />}
              </span>
              <span
                className={
                  completed
                    ? "text-[var(--text-muted)] line-through"
                    : "text-[var(--text-main)]"
                }
              >
                {i.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DealRoomPage() {
  const params = useParams();
  const dealRoomId = params?.id;
  const { user } = useUser();
  const myUserId = user?.id || user?._id;

  const [isLoading, setIsLoading] = useState(true);
  const [dealRoom, setDealRoom] = useState(null);

  const [nextStatus, setNextStatus] = useState("");
  const [isAdvancing, setIsAdvancing] = useState(false);

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
    if (dealRoom.status === "declined" || dealRoom.status === "closed") {
      setNextStatus("");
      return;
    }
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

  async function handleDecline() {
    if (isAdvancing) return;
    if (!window.confirm("Decline this deal? This can't be undone.")) return;
    setIsAdvancing(true);
    try {
      const updated = await patchDealRoomStatus(dealRoomId, "declined");
      setDealRoom(updated);
    } finally {
      setIsAdvancing(false);
    }
  }

  // "closed" isn't in STATUS_FLOW anymore, so it needs special handling here:
  // treat it as "beyond the last real step" so every earlier milestone (and
  // the Deal Closed milestone itself) correctly shows as done once closed.
  const currentIdx = currentStatus === "closed" ? STATUS_FLOW.length : STATUS_FLOW.indexOf(currentStatus);

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
                  const milestoneIdx = m.status === "closed" ? STATUS_FLOW.length : STATUS_FLOW.indexOf(m.status);
                  const done = milestoneIdx !== -1 && milestoneIdx <= currentIdx;

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

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {currentStatus === "closed" ? (
                  <div className="w-full rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <Badge className="bg-emerald-100 text-emerald-700">Deal closed</Badge>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Closed amount</p>
                        <p className="text-sm font-semibold text-[var(--text-main)]">
                          ${(dealRoom.amount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">
                          Success fee ({dealRoom.feePercentage ?? 3}%)
                        </p>
                        <p className="text-sm font-semibold text-[var(--text-main)]">
                          ${(dealRoom.feeAmount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--text-muted)]">Closed on</p>
                        <p className="text-sm font-semibold text-[var(--text-main)]">
                          {dealRoom.closedAt ? new Date(dealRoom.closedAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : currentStatus === "declined" ? (
                  <Badge className="bg-red-100 text-red-700">Deal declined</Badge>
                ) : (
                  <div className="w-full space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {nextStatus && (
                        <button
                          onClick={handleAdvance}
                          disabled={isAdvancing}
                          className="inline-flex items-center justify-center rounded-md bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                        >
                          {isAdvancing ? "Updating..." : `Advance to ${toLabel(nextStatus)}`}
                        </button>
                      )}
                      <button
                        onClick={handleDecline}
                        disabled={isAdvancing}
                        className="inline-flex items-center justify-center rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>

                    <CloseDealPanel dealRoom={dealRoom} myUserId={myUserId} onUpdated={setDealRoom} />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <DueDiligenceChecklist dealRoom={dealRoom} onUpdated={setDealRoom} />
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