"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPayouts, markPayoutAsPaid } from "@/lib/services/adminService";
import { showToast } from "@/lib/toast";

function AdminPayoutsContent() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPayouts({ limit: 50 });
      setPayouts(res.data || []);
    } catch (error) {
      showToast(error.message || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkPaid = async (id) => {
    setBusyId(id);
    try {
      await markPayoutAsPaid(id);
      showToast("Marked as paid");
      load();
    } catch (error) {
      showToast(error.message || "Failed to update payout");
    } finally {
      setBusyId(null);
    }
  };

  const totalOutstanding = payouts
    .filter((p) => p.payoutStatus !== "paid")
    .reduce((sum, p) => sum + (p.feeAmount || 0), 0);

  return (
    <AppShell title="Payouts" subtitle="Success fees owed from closed deals">
      <AdminNav />

      <Card className="mb-4">
        <CardDescription>Outstanding fees</CardDescription>
        <p className="mt-1 text-2xl font-semibold text-[var(--text-main)]">
          ${totalOutstanding.toLocaleString()}
        </p>
      </Card>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-[var(--surface)]" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <CardDescription className="p-5">No closed deals with fees yet.</CardDescription>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">Founder</th>
                <th className="px-4 py-3">Investor</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => {
                const id = p._id || p.id;
                const match = p.matchId || {};
                return (
                  <tr key={id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 font-medium text-[var(--text-main)]">
                      {match.founderId?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{match.investorId?.name || "—"}</td>
                    <td className="px-4 py-3">${(p.feeAmount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.payoutStatus === "paid" ? "success" : "warning"}>
                        {p.payoutStatus || "pending"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.payoutStatus !== "paid" && (
                        <Button size="sm" variant="outline" disabled={busyId === id} onClick={() => handleMarkPaid(id)}>
                          Mark as paid
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}

export default function AdminPayoutsPage() {
  return (
    <AuthGuard requireRole="admin">
      <AdminPayoutsContent />
    </AuthGuard>
  );
}