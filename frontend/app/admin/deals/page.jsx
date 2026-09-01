"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAllDeals, forceCloseDeal } from "@/lib/services/adminService";
import { showToast } from "@/lib/toast";

function statusVariant(status) {
  if (status === "closed") return "success";
  if (status === "declined") return "danger";
  if (status === "due_diligence" || status === "nda_signed") return "warning";
  return "default";
}

function AdminDealsContent() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllDeals({ status: statusFilter || undefined, limit: 50 });
      setDeals(res.data || []);
    } catch (error) {
      showToast(error.message || "Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleForceClose = async (id) => {
    if (!window.confirm("Force close this deal? This should only be used to resolve disputes.")) return;
    setBusyId(id);
    try {
      await forceCloseDeal(id);
      showToast("Deal force-closed");
      load();
    } catch (error) {
      showToast(error.message || "Failed to close deal");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell title="Deals" subtitle="Monitor and manage every deal room on the platform">
      <AdminNav />

      <div className="mb-4 flex flex-wrap gap-2">
        {["", "interested", "nda_signed", "due_diligence", "closed", "declined"].map((s) => (
          <Button
            key={s || "all"}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
          >
            {s ? s.replace(/_/g, " ") : "All"}
          </Button>
        ))}
      </div>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-[var(--surface)]" />
            ))}
          </div>
        ) : deals.length === 0 ? (
          <CardDescription className="p-5">No deals found for this filter.</CardDescription>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">Startup</th>
                <th className="px-4 py-3">Founder</th>
                <th className="px-4 py-3">Investor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Fee</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => {
                const id = deal._id || deal.id;
                const match = deal.matchId || {};
                return (
                  <tr key={id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 font-medium text-[var(--text-main)]">
                      {match.startupId?.startupName || "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{match.founderId?.name || "—"}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{match.investorId?.name || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(deal.status)}>{deal.status?.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {deal.feeAmount ? `$${deal.feeAmount.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link href={`/dealrooms/${id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                        {deal.status !== "closed" && deal.status !== "declined" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busyId === id}
                            onClick={() => handleForceClose(id)}
                          >
                            Force close
                          </Button>
                        )}
                      </div>
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

export default function AdminDealsPage() {
  return (
    <AuthGuard requireRole="admin">
      <AdminDealsContent />
    </AuthGuard>
  );
}