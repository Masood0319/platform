"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/lib/toast";
import { apiRequest } from "@/lib/apiClient";
import { useUser } from "@/components/providers/UserProvider";

export function CloseDealPanel({ dealRoom, onUpdated }) {
  const { user } = useUser();
  const [amount, setAmount] = useState(
    dealRoom?.closeProposal?.amount || dealRoom?.amount || ""
  );
  const [loading, setLoading] = useState(false);

  if (!dealRoom || dealRoom.status === "closed") {
    if (dealRoom?.status === "closed") {
      return (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">Deal Closed</p>
          <p className="mt-1 text-sm text-emerald-700">
            Amount: ${Number(dealRoom.amount || 0).toLocaleString()}
          </p>
          <p className="text-sm text-emerald-700">
            Success fee ({dealRoom.feePercentage || 3}%): $
            {Number(dealRoom.feeAmount || 0).toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  }

  const proposal = dealRoom.closeProposal;
  const isProposer =
    proposal?.proposedBy &&
    (proposal.proposedBy === user?._id ||
      proposal.proposedBy?._id === user?._id);
  const hasProposal = !!proposal?.amount;

  const handleProposeOrConfirm = async () => {
    const num = Number(amount);
    if (!num || num <= 0) {
      showToast("Enter a valid closing amount");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest(`deal-rooms/${dealRoom._id}/close`, {
        method: "POST",
        data: { amount: num },
      });

      showToast(res.message || "Success");
      if (onUpdated) onUpdated(res.data?.dealRoom || res.data);
    } catch (err) {
      showToast(err.message || "Failed to process close");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[var(--text-main)]">
        Close Deal & Success Fee
      </h3>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Both parties must confirm the same amount. Platform fee is{" "}
        {dealRoom.feePercentage || 3}% of the final investment.
      </p>

      {hasProposal && (
        <div className="mt-3 rounded-lg bg-[var(--surface)] px-3 py-2 text-xs">
          {isProposer ? (
            <p>
              You proposed <strong>${Number(proposal.amount).toLocaleString()}</strong>.
              Waiting for the other party to confirm.
            </p>
          ) : (
            <p>
              Other party proposed{" "}
              <strong>${Number(proposal.amount).toLocaleString()}</strong>.
              Confirm with the same amount to close.
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">
            Closing Amount (USD)
          </label>
          <Input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 250000"
            disabled={loading || (hasProposal && isProposer)}
          />
        </div>

        <Button
          onClick={handleProposeOrConfirm}
          disabled={loading || (hasProposal && isProposer)}
          className="sm:w-auto"
        >
          {loading
            ? "Processing…"
            : hasProposal && !isProposer
            ? "Confirm & Close"
            : "Propose Close"}
        </Button>
      </div>

      {amount && Number(amount) > 0 && (
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Estimated fee: $
          {(
            (Number(amount) * (dealRoom.feePercentage || 3)) /
            100
          ).toLocaleString()}
        </p>
      )}
    </div>
  );
}