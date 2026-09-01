"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getVerificationRequests,
  approveVerification,
  rejectVerification,
} from "@/lib/services/adminService";
import { showToast } from "@/lib/toast";

function AdminVerificationsContent() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getVerificationRequests({ status: statusFilter || undefined, limit: 50 });
      setRequests(res.data || []);
    } catch (error) {
      showToast(error.message || "Failed to load verification requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await approveVerification(id);
      showToast("Verification approved");
      load();
    } catch (error) {
      showToast(error.message || "Failed to approve verification");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejecting this verification:", "");
    if (reason === null) return;
    setBusyId(id);
    try {
      await rejectVerification(id, reason);
      showToast("Verification rejected");
      load();
    } catch (error) {
      showToast(error.message || "Failed to reject verification");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell title="Verification requests" subtitle="Review uploaded proof of identity or accreditation">
      <AdminNav />

      <div className="mb-4 flex gap-2">
        {["pending", "approved", "rejected", ""].map((s) => (
          <Button
            key={s || "all"}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
          >
            {s ? s[0].toUpperCase() + s.slice(1) : "All"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-28 animate-pulse" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardDescription>No verification requests found for this filter.</CardDescription>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const id = req._id || req.id;
            return (
              <Card key={id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-[var(--text-main)]">
                      {req.userId?.name || "Unknown user"}
                    </p>
                    <Badge variant="outline">{req.type}</Badge>
                    <Badge
                      variant={
                        req.status === "approved" ? "success" : req.status === "rejected" ? "danger" : "warning"
                      }
                    >
                      {req.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{req.userId?.email}</p>
                  {req.documents?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {req.documents.map((doc, i) => (
                        <a
                          key={i}
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-[var(--primary)] hover:underline"
                        >
                          View {doc.type.replace(/_/g, " ")}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" disabled={busyId === id} onClick={() => handleApprove(id)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="ghost" disabled={busyId === id} onClick={() => handleReject(id)}>
                      Reject
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

export default function AdminVerificationsPage() {
  return (
    <AuthGuard requireRole="admin">
      <AdminVerificationsContent />
    </AuthGuard>
  );
}