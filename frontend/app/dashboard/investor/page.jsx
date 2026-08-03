"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/apiClient";
import { Search, TrendingUp, Users, DollarSign, MapPin } from "lucide-react";
import { getStartups } from "@/lib/services/startupService";

function formatCurrency(amount = 0, currency = "USD") {
  const symbols = { USD: "$", EUR: "€", GBP: "£" };
  const symbol = symbols[currency] || "$";
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(0)}K`;
  return `${symbol}${amount}`;
}

function FeaturedStartupsSkeleton() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="mt-3 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-4/5" />
          <Skeleton className="mt-4 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export default function InvestorDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState(null);

  const [featuredStartups, setFeaturedStartups] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [industryFilter, setIndustryFilter] = useState("All");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const [userRes, portfolioRes] = await Promise.all([
          apiRequest("auth/me", { method: "GET", cache: "no-store" }),
          apiRequest("investors/me/portfolio", { method: "GET", cache: "no-store" }).catch(() => null),
        ]);
        setUser(userRes?.data?.user);
        setPortfolio(portfolioRes?.data || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const data = await getStartups();
        // Fetch a bit more than we show so the industry filter has something to work with
        setFeaturedStartups(data.slice(0, 9));
      } catch (err) {
        console.error("Failed to fetch featured startups:", err);
      } finally {
        setLoadingFeatured(false);
      }
    }
    fetchFeatured();
  }, []);

  const industries = useMemo(() => {
    const all = featuredStartups.flatMap((s) => s.industryTags || (s.industry ? [s.industry] : []));
    return ["All", ...Array.from(new Set(all)).slice(0, 5)];
  }, [featuredStartups]);

  const visibleStartups = useMemo(() => {
    const filtered =
      industryFilter === "All"
        ? featuredStartups
        : featuredStartups.filter((s) =>
            (s.industryTags || []).includes(industryFilter) || s.industry === industryFilter
          );
    return filtered.slice(0, 3);
  }, [featuredStartups, industryFilter]);

  if (loading) {
    return (
      <AppShell title="Investor Dashboard" subtitle="Loading your dashboard...">
        <div className="animate-pulse space-y-6">
          <Card className="h-32" />
          <Card className="h-64" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Investor Dashboard"
      subtitle="Discover promising startups and manage your investments"
    >
      <div className="space-y-6 sm:space-y-8">
        {/* Hero Section */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] opacity-10" />
          <div className="relative p-5 sm:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[var(--text-main)]">
                  Welcome back, {user?.name || "Investor"}!
                </h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Explore high-potential startups and build your portfolio.
                </p>
              </div>
              <Link href="/startups">
                <Button className="gap-2">
                  <Search size={16} />
                  Browse Startups
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* Investment Overview */}
        <Card>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[var(--primary)]" />
            Investment Overview
          </CardTitle>
          <CardDescription className="mt-1">
            Your investment activity and portfolio summary
          </CardDescription>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <StatTile
              label="Total Invested"
              value={formatCurrency(portfolio?.totalInvested || 0, portfolio?.currency)}
              icon={DollarSign}
            />
            <StatTile
              label="Active Deals"
              value={portfolio?.activeDeals ?? 0}
              icon={TrendingUp}
            />
            <StatTile
              label="Startups Tracked"
              value={portfolio?.startupsTracked ?? 0}
              icon={Users}
            />
          </div>
        </Card>

        {/* Featured Startups */}
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Featured Startups</CardTitle>
              <CardDescription className="mt-1">Discover promising opportunities</CardDescription>
            </div>
            <Link href="/startups" className="flex-shrink-0">
              <Button variant="outline" className="w-full sm:w-auto">
                View All
              </Button>
            </Link>
          </div>

          {!loadingFeatured && industries.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {industries.map((ind) => (
                <button
                  key={ind}
                  onClick={() => setIndustryFilter(ind)}
                  className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    industryFilter === ind
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                      : "border-[var(--border)] bg-white text-[var(--text-main)] hover:border-[var(--primary)]/40"
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          )}

          {loadingFeatured ? (
            <FeaturedStartupsSkeleton />
          ) : visibleStartups.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleStartups.map((startup) => (
                <Link key={startup.id} href={`/startup/${startup.id}`}>
                  <div className="h-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--primary)]/40">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <h3 className="truncate font-semibold text-[var(--text-main)]">
                        {startup.name}
                      </h3>
                      {startup.stage && <Badge className="flex-shrink-0">{startup.stage}</Badge>}
                    </div>
                    <p className="mb-3 line-clamp-2 text-sm text-[var(--text-muted)]">
                      {startup.tagline}
                    </p>
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                      {startup.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin size={11} />
                          {startup.location}
                        </span>
                      )}
                      <span className="flex-shrink-0">{startup.investorsInterested ?? 0} interested</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-muted)]">
              No startups found{industryFilter !== "All" ? ` in ${industryFilter}` : ""} right now.
            </div>
          )}
        </Card>

        {/* Business Metrics */}
        <Card>
          <CardTitle>Business Metrics</CardTitle>
          <CardDescription className="mt-1">
            A concise view of your investment pipeline and deal activity
          </CardDescription>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatTile label="Startups Reviewed" value={featuredStartups.length} icon={Search} />
            <StatTile label="Interests Sent" value="—" icon={DollarSign} />
            <StatTile label="Active Matches" value={portfolio?.activeDeals ?? 0} icon={TrendingUp} />
            <StatTile label="Active Deal Rooms" value={portfolio?.activeDeals ?? 0} icon={Users} />
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