"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/apiClient";
import {
  Plus,
  TrendingUp,
  Users,
  DollarSign,
  Sparkles,
  ArrowUpRight,
  Pencil,
} from "lucide-react";

// Computes how complete a startup profile is, weighted across the key sections
// used in the create-startup wizard, so the nudge reflects real gaps.
function getProfileCompletion(startup) {
  if (!startup) return 0;
  const checks = [
    !!startup.name,
    !!startup.tagline,
    !!startup.description,
    (startup.industryTags || []).length > 0,
    !!startup.stage,
    !!startup.fundingTarget,
    !!startup.logoUrl,
    !!startup.pitchDeckUrl,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

function formatCurrency(amount = 0, currency = "USD") {
  const symbols = { USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] || "$";
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(0)}K`;
  return `${symbol}${amount}`;
}

export default function FounderDashboard() {
  const [user, setUser] = useState(null);
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userRes, startupRes] = await Promise.all([
          apiRequest("auth/me", { method: "GET", cache: "no-store" }),
          apiRequest("startups/mine", { method: "GET", cache: "no-store" }).catch(() => null),
        ]);
        setUser(userRes?.data?.user);
        setStartup(startupRes?.data?.startup || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const completion = useMemo(() => getProfileCompletion(startup), [startup]);
  const hasStartup = !!startup;

  if (loading) {
    return (
      <AppShell title="Founder Dashboard" subtitle="Loading your dashboard...">
        <div className="animate-pulse space-y-6">
          <Card className="h-32" />
          <Card className="h-64" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Founder Dashboard" subtitle="Manage your startup and funding progress">
      <div className="space-y-6 sm:space-y-8">
        {/* Hero Section */}
        <Card className="relative          overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] opacity-10" />
          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-main)]">
                  Welcome back, {user?.name || "Founder"}!
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {hasStartup
                    ? "Here's how your startup is performing with investors."
                    : "Ready to grow your startup? Let's connect with the right investors."}
                </p>
              </div>
              <Link href={hasStartup ? `/startups/${startup._id}/edit` : "/dashboard/founder/create-startup"}>
                <Button className="gap-2">
                  {hasStartup ? <Pencil size={16} /> : <Plus size={16} />}
                  {hasStartup ? "Edit Startup Profile" : "List Your Startup"}
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Profile completion nudge — only matters before the profile is fully filled out */}
        {hasStartup && completion < 100 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Sparkles size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-main)]">
                    Your profile is {completion}% complete
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                    Complete startups get up to 3x more investor interest.
                  </p>
                </div>
              </div>
              <Link href={`/startups/${startup._id}/edit`} className="flex-shrink-0">
                <Button size="sm" variant="outline" className="w-full gap-1.5 sm:w-auto">
                  Finish profile
                  <ArrowUpRight size={14} />
                </Button>
              </Link>
            </div>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>
          </Card>
        )}

        {/* Startup Overview */}
        <Card>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[var(--primary)]" />
            Startup Overview
          </CardTitle>
          <CardDescription className="mt-1">
            {hasStartup
              ? `${startup.name}'s current status and key metrics`
              : "Your startup's current status and key metrics"}
          </CardDescription>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatTile
              label="Funding Raised"
              value={
                hasStartup
                  ? formatCurrency(startup.fundingRaised || 0, startup.currency)
                  : "$0"
              }
              icon={DollarSign}
            />
            <StatTile
              label="Investors Interested"
              value={hasStartup ? startup.investorsInterested ?? 0 : 0}
              icon={Users}
            />
            <StatTile
              label="Active Deals"
              value={hasStartup ? startup.activeDeals ?? 0 : 0}
              icon={TrendingUp}
            />
          </div>

          {hasStartup && startup.fundingTarget > 0 && (
            <div className="mt-6">
              <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Funding progress</span>
                <span>
                  {formatCurrency(startup.fundingRaised || 0, startup.currency)} of{" "}
                  {formatCurrency(startup.fundingTarget, startup.currency)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                  style={{
                    width: `${Math.min(
                      100,
                      ((startup.fundingRaised || 0) / startup.fundingTarget) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {!hasStartup && (
            <div className="mt-6">
              <Link href="/dashboard/founder/create-startup">
                <Button variant="outline" className="gap-2">
                  <Plus size={16} />
                  Create Your Startup Profile
                </Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Business Metrics */}
        <Card>
          <CardTitle>Business Metrics</CardTitle>
          <CardDescription className="mt-1">
            A concise view of your fundraising momentum and investor readiness
          </CardDescription>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Total Startups" value={hasStartup ? "1" : "0"} icon={TrendingUp} />
            <StatTile label="Profile Views" value="—" icon={Users} />
            <StatTile
              label="Interest Requests"
              value={hasStartup ? startup.investorsInterested ?? 0 : 0}
              icon={Sparkles}
            />
            <StatTile
              label="Active Deal Rooms"
              value={hasStartup ? startup.activeDeals ?? 0 : 0}
              icon={DollarSign}
            />
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {label}
          </p>
          <p className="mt-2 text-lg font-semibold text-[var(--primary)]">{value}</p>
        </div>
        <Icon size={20} className="flex-shrink-0 text-[var(--text-muted)]" />
      </div>
    </div>
  );
}