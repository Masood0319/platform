"use client";

import { useMemo, useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { InvestorCard } from "@/components/investor-card";
import { InvestorSearchBar } from "@/components/investor-search-bar";
import { getInvestors } from "@/lib/services/userService";

import { showToast } from "@/lib/toast";
import { LayoutGrid, List, X, ArrowUpDown, RotateCcw } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 9;

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "name_asc", label: "Name (A–Z)" },
  { value: "name_desc", label: "Name (Z–A)" },
];

function uniqueValues(values) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function sortInvestors(list, sortBy) {
  if (sortBy === "name_asc") {
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }
  if (sortBy === "name_desc") {
    return [...list].sort((a, b) => b.name.localeCompare(a.name));
  }
  return list;
}

export default function InvestorsPage() {
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    industry: "",
    range: "",
    location: "",
  });

  // --- New UI state ---
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [sortBy, setSortBy] = useState("relevance");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Normalize backend investor to frontend-expected shape
  const normalizeInvestor = (raw) => {
    // Backend stores investor data in `investorProfile` (not `profile`)
    const ip = raw.investorProfile || {};
    // investmentRange is an object { min, max } on backend
    const range = ip.investmentRange
      ? `$${(ip.investmentRange.min || 0).toLocaleString()} - $${(ip.investmentRange.max || 0).toLocaleString()}`
      : raw.range || '';
    // bio is top-level on User model
    const bio = raw.bio || '';

    return {
      id: raw._id,
      name: raw.name,
      type: ip.firmName || raw.type || '',
      location: raw.location || '',
      range,
      industries: ip.industries || raw.industries || [],
      bio,
      verified: Boolean(raw.verified),
    };
  };

  useEffect(() => {
    async function fetchInvestors() {
      try {
        const data = await getInvestors();
        setInvestors(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch investors:", error);
        showToast("Failed to load investors");
      } finally {
        setLoading(false);
      }
    }
    fetchInvestors();
  }, []);




  const industryOptions = useMemo(
    () => uniqueValues(investors.flatMap((investor) => (investor.investorProfile?.industries) || [])),
    [investors]
  );
  const rangeOptions = useMemo(
    () => uniqueValues(investors.map((investor) => investor.investorProfile?.investmentRange).filter(Boolean)),
    [investors]
  );

  const filteredInvestors = useMemo(() => {
    const query = filters.search.trim().toLowerCase();

    return investors.filter((investor) => {
      const ip = investor.investorProfile || {};
      const matchesSearch = query
        ? (investor.name || '').toLowerCase().includes(query) ||
          (ip.industries || []).some((industry) => industry.toLowerCase().includes(query)) ||
          (investor.bio || '').toLowerCase().includes(query)
        : true;

      const matchesIndustry = filters.industry
        ? (ip.industries || []).includes(filters.industry)
        : true;

      const matchesRange = filters.range
        ? JSON.stringify(ip.investmentRange) === filters.range
        : true;

      return matchesSearch && matchesIndustry && matchesRange;
    });
  }, [filters, investors]);

  const mappedInvestors = useMemo(() => {
    const mapped = filteredInvestors.map(normalizeInvestor);
    return sortInvestors(mapped, sortBy);
  }, [filteredInvestors, sortBy]);

  // Reset pagination whenever filters/sort narrow the result set
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filters, sortBy]);

  const visibleInvestors = mappedInvestors.slice(0, visibleCount);
  const hasMore = visibleCount < mappedInvestors.length;

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (filters.search.trim()) chips.push({ key: "search", label: `"${filters.search.trim()}"` });
    if (filters.industry) chips.push({ key: "industry", label: filters.industry });
    if (filters.range) chips.push({ key: "range", label: filters.range });
    if (filters.location) chips.push({ key: "location", label: filters.location });
    return chips;
  }, [filters]);

  const removeFilter = (key) => {
    setFilters((prev) => ({ ...prev, [key]: "" }));
  };

  const clearAllFilters = () => {
    setFilters({ search: "", industry: "", range: "", location: "" });
  };

  if (loading) {
    return (
      <AppShell title="Investors" subtitle="Loading investors...">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Investors"
      subtitle="Discover investors interested in funding startups."
    >
      <InvestorSearchBar
        filters={filters}
        onFiltersChange={setFilters}
        industryOptions={industryOptions}
        rangeOptions={rangeOptions}
        locationOptions={[]} // No location in current API
      />

      {/* Active filter chips */}
      {activeFilterChips.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {activeFilterChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => removeFilter(chip.key)}
              className="flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text-main)] transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            >
              {chip.label}
              <X size={12} />
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)]"
          >
            <RotateCcw size={12} />
            Clear all
          </button>
        </div>
      )}

      {/* Results bar: count, sort, view toggle */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--text-muted)]">
          <span className="font-semibold text-[var(--text-main)]">{mappedInvestors.length}</span>{" "}
          investor{mappedInvestors.length === 1 ? "" : "s"} found
        </p>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="min-h-[40px] appearance-none rounded-full border border-[var(--border)] bg-white pl-8 pr-8 text-sm font-medium text-[var(--text-main)] outline-none transition hover:border-[var(--primary)]/40 focus:border-[var(--primary)]/40"
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

          <div className="flex rounded-full border border-[var(--border)] bg-white p-0.5">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                viewMode === "grid"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface)]"
              }`}
              aria-label="Grid view"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                viewMode === "list"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-muted)] hover:bg-[var(--surface)]"
              }`}
              aria-label="List view"
              aria-pressed={viewMode === "list"}
            >
              <List size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <section
        className={
          viewMode === "grid"
            ? "mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            : "mt-4 flex flex-col gap-3"
        }
      >
        {visibleInvestors.map((investor) => (
          <InvestorCard
            key={investor.id}
            investor={investor}
            variant={viewMode === "grid" ? "detailed" : "compact"}
          />
        ))}
      </section>

      {/* Load more */}
      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="min-h-[44px] rounded-full border border-[var(--border)] bg-white px-6 py-2 text-sm font-semibold text-[var(--text-main)] shadow-sm transition hover:border-[var(--primary)]/40"
          >
            Load more investors
          </button>
        </div>
      )}

      {mappedInvestors.length === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--text-muted)]">
          <p className="font-medium text-[var(--text-main)]">No investors found</p>
          <p className="mt-1">Try adjusting your filters or search terms.</p>
          {activeFilterChips.length > 0 && (
            <button
              onClick={clearAllFilters}
              className="mt-4 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--text-main)] hover:border-[var(--primary)]/40"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </AppShell>
  );
}