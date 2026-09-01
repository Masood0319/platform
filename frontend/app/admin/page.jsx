"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/services/adminService";
import { showToast } from "@/lib/toast";

function StatCard({ label, value, hint }) {
  return (
    <Card>
      <CardDescription>{label}</CardDescription>
      <p className="mt-1 text-2xl font-semibold text-[var(--text-main)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
    </Card>
  );
}

function AdminOverviewContent() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await getDashboardStats();
        if (active) setStats(data);
      } catch (error) {
        showToast(error.message || "Failed to load dashboard stats");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell title="Admin Dashboard" subtitle="Platform overview and key metrics">
      <AdminNav />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="h-24 animate-pulse" />
          ))}
        </div>
      ) : !stats ? (
        <Card>
          <CardDescription>Could not load dashboard stats. Try refreshing.</CardDescription>
        </Card>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Users
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total users" value={stats.users.total} />
              <StatCard label="Founders" value={stats.users.founders} />
              <StatCard label="Investors" value={stats.users.investors} />
              <StatCard label="New today" value={stats.users.newToday} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Startups
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard label="Total startups" value={stats.startups.total} />
              <StatCard label="Published" value={stats.startups.published} />
              <StatCard label="New this week" value={stats.startups.newThisWeek} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Deals
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Total interests" value={stats.deals.totalInterests} />
              <StatCard label="Total matches" value={stats.deals.totalMatches} />
              <StatCard label="Active deals" value={stats.deals.active} />
              <StatCard label="Closed deals" value={stats.deals.closed} />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Verifications &amp; Revenue
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
              <StatCard
                label="Pending verifications"
                value={stats.verifications.pending}
                hint={stats.verifications.pending > 0 ? "Needs review" : "All caught up"}
              />
              <StatCard
                label="Total revenue"
                value={`$${(stats.revenue.total || 0).toLocaleString()}`}
                hint="From closed deals"
              />
            </div>
          </section>
        </div>
      )}
    </AppShell>
  );
}

export default function AdminOverviewPage() {
  return (
    <AuthGuard requireRole="admin">
      <AdminOverviewContent />
    </AuthGuard>
  );
}