"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { DealCard } from "@/components/deal-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinimumDelay } from "@/lib/useMinimumDelay";
import { Search, ArrowUpDown, Handshake } from "lucide-react";

const STATUS_FILTERS = ["All", "Requested", "Under Review", "Negotiation", "Closed"];

const SORT_OPTIONS = [
  { value: "recent", label: "Most recent" },
  { value: "amount_desc", label: "Amount (high to low)" },
  { value: "amount_asc", label: "Amount (low to high)" },
];

function parseAmount(amountStr = "") {
  return Number(amountStr.replace(/[^0-9.]/g, "")) || 0;
}

function sortDeals(deals, sortBy) {
  if (sortBy === "amount_desc") {
    return [...deals].sort((a, b) => parseAmount(b.amount) - parseAmount(a.amount));
  }
  if (sortBy === "amount_asc") {
    return [...deals].sort((a, b) => parseAmount(a.amount) - parseAmount(b.amount));
  }
  return deals;
}

function formatTotal(deals) {
  const total = deals.reduce((sum, d) => sum + parseAmount(d.amount), 0);
  if (total >= 1_000_000) return `$${(total / 1_000_000).toFixed(1)}M`;
  if (total >= 1_000) return `$${(total / 1_000).toFixed(0)}K`;
  return `$${total}`;
}

function DealsSkeleton() {
  return (
    <section
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in"
      aria-busy="true"
      aria-live="polite"
    >
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-3 w-24" />
          <Skeleton className="mt-4 h-6 w-20 rounded-full" />
          <div className="mt-4 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </section>
  );
}

export default function DealsPage() {
  const [isLoading] = useMinimumDelay({ delay: 700 });
  const deals = [
    { id: "d1", startup: "FlowLedger", investor: "Nadia Kapoor", amount: "$750,000", equity: "8%", status: "Requested" },
    { id: "d2", startup: "MediSpan", investor: "RiverStone Capital", amount: "$2,200,000", equity: "14%", status: "Under Review" },
    { id: "d3", startup: "GridNova", investor: "Aster Ventures", amount: "$5,000,000", equity: "18%", status: "Negotiation" },
  ];

  // --- New UI state ---
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  const filteredDeals = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const byStatus = deals.filter((d) => statusFilter === "All" || d.status === statusFilter);
    const bySearch = q
      ? byStatus.filter(
          (d) =>
            d.startup.toLowerCase().includes(q) || d.investor.toLowerCase().includes(q)
        )
      : byStatus;
    return sortDeals(bySearch, sortBy);
  }, [deals, statusFilter, searchQuery, sortBy]);

  const statusCounts = useMemo(() => {
    const counts = { All: deals.length };
    for (const status of STATUS_FILTERS.slice(1)) {
      counts[status] = deals.filter((d) => d.status === status).length;
    }
    return counts;
  }, [deals]);

  if (isLoading) {
    return (
      <AppShell
        title="Deals & Funding"
        subtitle="Track active negotiations, requested terms, and closed rounds."
      >
        <DealsSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Deals & Funding"
      subtitle="Track active negotiations, requested terms, and closed rounds."
    >
      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <p className="text-xs text-[var(--text-muted)]">Total deals</p>
          <p className="mt-1 text-xl font-semibold text-[var(--text-main)]">{deals.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <p className="text-xs text-[var(--text-muted)]">Total value</p>
          <p className="mt-1 text-xl font-semibold text-[var(--text-main)]">{formatTotal(deals)}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <p className="text-xs text-[var(--text-muted)]">In negotiation</p>
          <p className="mt-1 text-xl font-semibold text-[var(--text-main)]">
            {statusCounts["Negotiation"] || 0}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <p className="text-xs text-[var(--text-muted)]">Under review</p>
          <p className="mt-1 text-xl font-semibold text-[var(--text-main)]">
            {statusCounts["Under Review"] || 0}
          </p>
        </div>
      </div>

      {/* Filters & search */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                statusFilter === status
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-white text-[var(--text-main)] hover:border-[var(--primary)]/40"
              }`}
            >
              {status}
              {statusCounts[status] !== undefined && (
                <span className="ml-1.5 opacity-70">{statusCounts[status]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="relative flex-1 sm:flex-none sm:w-52">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals..."
              className="min-h-[40px] w-full rounded-full border border-[var(--border)] bg-white pl-9 pr-3 text-sm outline-none transition focus:border-[var(--primary)]/40"
            />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="min-h-[40px] appearance-none rounded-full border border-[var(--border)] bg-white pl-8 pr-8 text-sm font-medium text-[var(--text-main)] outline-none transition hover:border-[var(--primary)]/40"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ArrowUpDown
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            />
          </div>
        </div>
      </div>

      {filteredDeals.length > 0 ? (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDeals.map((deal) => (
            <DealCard
              key={deal.id}
              startup={deal.startup}
              investor={deal.investor}
              amount={deal.amount}
              equity={deal.equity}
              status={deal.status}
            />
          ))}
        </section>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--text-muted)]">
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface)]">
            <Handshake size={20} className="text-[var(--text-muted)]" />
          </div>
          <p className="font-medium text-[var(--text-main)]">
            {deals.length === 0 ? "No deals available" : "No deals match your filters"}
          </p>
          {deals.length > 0 && (
            <p>Try a different status or search term.</p>
          )}
        </div>
      )}
    </AppShell>
  );
}