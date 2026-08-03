// components/discover/DiscoverHero.jsx

import { useState, useEffect } from "react";
import { Search, Building2, TrendingUp, Handshake, DollarSign } from "lucide-react";

const SEARCH_SCOPES = [
  { value: "all", label: "All" },
  { value: "startups", label: "Startups" },
  { value: "investors", label: "Investors" },
];

function formatStatValue(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    notation: num >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(num);
}

function formatCurrencyStat(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(num);
}

function StatCard({ icon: Icon, label, value, loading }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white/15">
        <Icon size={16} className="text-white" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        {loading ? (
          <div className="h-5 w-14 animate-pulse rounded bg-white/25" />
        ) : (
          <p className="text-lg font-semibold leading-tight text-white">{value}</p>
        )}
        <p className="truncate text-xs text-white/70">{label}</p>
      </div>
    </div>
  );
}

/**
 * DiscoverHero
 * Large gradient hero with role-aware copy, global search, and platform
 * stats. Search input calls `onSearch` on every keystroke — debouncing
 * itself happens one level up in app/discover/page.jsx, so this component
 * stays a simple controlled input.
 */
export default function DiscoverHero({ role, stats, searchQuery, searchScope, onSearch, loading }) {
  const [localQuery, setLocalQuery] = useState(searchQuery || "");
  const [localScope, setLocalScope] = useState(searchScope || "all");

  useEffect(() => {
    setLocalQuery(searchQuery || "");
  }, [searchQuery]);

  const isFounder = role === "founder";

  const handleQueryChange = (value) => {
    setLocalQuery(value);
    onSearch({ query: value, scope: localScope });
  };

  const handleScopeChange = (value) => {
    setLocalScope(value);
    onSearch({ query: localQuery, scope: value });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 px-6 py-10 sm:px-10 sm:py-14">
      {/* Decorative gradient accents */}
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-3xl text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
          {isFounder ? "Find the right investors for your raise" : "Discover startups worth backing"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/70 sm:text-base">
          {isFounder
            ? "Explore investors matched to your industry, stage, and check size — and start meaningful conversations."
            : "Explore vetted startups actively raising, filtered to your thesis, stage, and industries of interest."}
        </p>

        {/* Search */}
        <div className="mx-auto mt-7 max-w-xl">
          <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/95 px-4 py-3 shadow-lg">
            <Search size={16} className="flex-shrink-0 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder={
                isFounder
                  ? "Search investors by name, industry, or country..."
                  : "Search startups by name, industry, or technology..."
              }
              aria-label="Search Discover"
              className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
            {SEARCH_SCOPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleScopeChange(opt.value)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  localScope === opt.value
                    ? "bg-white text-slate-900"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            icon={Building2}
            label="Total Startups"
            value={formatStatValue(stats?.totalStartups)}
            loading={loading}
          />
          <StatCard
            icon={TrendingUp}
            label="Total Investors"
            value={formatStatValue(stats?.totalInvestors)}
            loading={loading}
          />
          <StatCard
            icon={Handshake}
            label="Active Deals"
            value={formatStatValue(stats?.activeDeals)}
            loading={loading}
          />
          <StatCard
            icon={DollarSign}
            label="Total Raised"
            value={formatCurrencyStat(stats?.totalFundingRaised)}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}