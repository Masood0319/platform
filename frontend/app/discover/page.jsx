"use client";

// app/discover/page.jsx

import { useState, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useUser } from "@/components/providers/UserProvider";
import { getStartups } from "@/lib/services/startupService";
import { getInvestors } from "@/lib/services/userService";

import SectionHeader from "@/components/discover/SectionHeader";
import EmptyState from "@/components/discover/EmptyState";
import LoadingSkeleton from "@/components/discover/LoadingSkeleton";
import DiscoverGrid from "@/components/discover/DiscoverGrid";
import DiscoverFilters from "@/components/discover/DiscoverFilters";
import DiscoverHero from "@/components/discover/DiscoverHero";

/* ============================================================================
 * CONFIG
 * ========================================================================== */

const DEFAULT_FILTERS = {
  industry: "all",
  country: "all",
  fundingStage: "all",
  investmentStage: "all",
  investmentSize: "all",
  fundingGoal: "all",
  verifiedOnly: false,
  featuredOnly: false,
  recentlyActive: false,
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "trending", label: "Trending" },
  { value: "mostViewed", label: "Most Viewed" },
  { value: "mostInterested", label: "Most Interested" },
  { value: "alphabetical", label: "Alphabetical" },
  { value: "fundingGoal", label: "Funding Goal" },
  { value: "recentlyActive", label: "Recently Active" },
];

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 350;
const RECENTLY_ACTIVE_WINDOW_DAYS = 7;

/* ============================================================================
 * FIELD ACCESSORS
 * Defensive readers for fields whose exact backend name we can't confirm yet.
 * These never invent data — they only widen which real field name is read.
 * ========================================================================== */

function getTimestamp(item) {
  const raw = item?.createdAt || item?.joinedAt || item?.publishedAt;
  const time = raw ? new Date(raw).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
}

function getViews(item) {
  return Number(item?.viewCount ?? item?.views ?? 0) || 0;
}

function getInterestCount(item) {
  return Number(item?.interestCount ?? item?.interestedCount ?? item?.matchCount ?? 0) || 0;
}

function getName(item) {
  return item?.name || item?.startupName || item?.fullName || "";
}

function getRaised(startup) {
  return Number(startup?.raisedAmount ?? startup?.amountRaised ?? startup?.fundingRaised ?? 0) || 0;
}

function getGoal(item) {
  return Number(item?.fundingGoal ?? item?.goalAmount ?? item?.targetAmount ?? 0) || 0;
}

function isVerified(item) {
  return Boolean(item?.isVerified ?? item?.verified);
}

function isFeatured(item) {
  return Boolean(item?.isFeatured ?? item?.featured);
}

function isRecentlyActive(item) {
  const raw = item?.lastActiveAt || item?.updatedAt;
  if (!raw) return false;
  const days = (Date.now() - new Date(raw).getTime()) / (1000 * 60 * 60 * 24);
  return days <= RECENTLY_ACTIVE_WINDOW_DAYS;
}

/* ============================================================================
 * DiscoverPage
 * ========================================================================== */

export default function DiscoverPage() {
  const { user } = useUser();
  const role = user?.role === "investor" ? "investor" : "founder";
  // Investors browse startups; founders browse investors.
  const primaryMode = role === "investor" ? "startups" : "investors";

  const [startups, setStartups] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState("all");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // --- Debounced search ---
  useEffect(() => {
    const id = setTimeout(
      () => setDebouncedQuery(searchQuery.trim().toLowerCase()),
      SEARCH_DEBOUNCE_MS
    );
    return () => clearTimeout(id);
  }, [searchQuery]);

  // --- Load data (both lists, so header stats stay accurate regardless of role) ---
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [startupResults, investorResults] = await Promise.all([
        getStartups(),
        getInvestors(),
      ]);
      setStartups(Array.isArray(startupResults) ? startupResults : []);
      setInvestors(Array.isArray(investorResults) ? investorResults : []);
    } catch (err) {
      console.error("Failed to load Discover data:", err);
      setLoadError(err?.message || "Something went wrong while loading Discover.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset pagination whenever query/filters/sort/mode changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedQuery, filters, sortBy, primaryMode]);

  const primaryItems = primaryMode === "startups" ? startups : investors;

  /* ---------- search / filter / sort ---------- */

  const matchesSearch = useCallback(
    (item) => {
      if (!debouncedQuery) return true;
      const haystack = [
        getName(item),
        item?.company,
        item?.industry,
        item?.country,
        item?.technology,
        item?.founderName,
        ...(Array.isArray(item?.industries) ? item.industries : []),
        ...(Array.isArray(item?.tags) ? item.tags : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(debouncedQuery);
    },
    [debouncedQuery]
  );

  const matchesFilters = useCallback(
    (item) => {
      if (filters.industry !== "all") {
        const industries = Array.isArray(item?.industries)
          ? item.industries
          : [item?.industry].filter(Boolean);
        if (!industries.includes(filters.industry)) return false;
      }
      if (filters.country !== "all" && item?.country !== filters.country) return false;
      if (filters.fundingStage !== "all" && item?.fundingStage !== filters.fundingStage) return false;
      if (filters.investmentStage !== "all" && item?.investmentStage !== filters.investmentStage) return false;
      if (filters.verifiedOnly && !isVerified(item)) return false;
      if (filters.featuredOnly && !isFeatured(item)) return false;
      if (filters.recentlyActive && !isRecentlyActive(item)) return false;
      return true;
    },
    [filters]
  );

  const sortItems = useCallback(
    (items) => {
      const copy = [...items];
      switch (sortBy) {
        case "trending":
          return copy.sort(
            (a, b) => getInterestCount(b) + getViews(b) - (getInterestCount(a) + getViews(a))
          );
        case "mostViewed":
          return copy.sort((a, b) => getViews(b) - getViews(a));
        case "mostInterested":
          return copy.sort((a, b) => getInterestCount(b) - getInterestCount(a));
        case "alphabetical":
          return copy.sort((a, b) => getName(a).localeCompare(getName(b)));
        case "fundingGoal":
          return copy.sort((a, b) => getGoal(b) - getGoal(a));
        case "recentlyActive":
          return copy.sort(
            (a, b) =>
              new Date(b?.lastActiveAt || b?.updatedAt || 0) -
              new Date(a?.lastActiveAt || a?.updatedAt || 0)
          );
        case "newest":
        default:
          return copy.sort((a, b) => getTimestamp(b) - getTimestamp(a));
      }
    },
    [sortBy]
  );

  const filteredResults = useMemo(() => {
    const filtered = primaryItems.filter((item) => matchesSearch(item) && matchesFilters(item));
    return sortItems(filtered);
  }, [primaryItems, matchesSearch, matchesFilters, sortItems]);

  const visibleResults = filteredResults.slice(0, visibleCount);
  const hasMore = visibleCount < filteredResults.length;

  /* ---------- curated sections (independent of active search/filter) ---------- */

  const sections = useMemo(() => {
    const build = (items) => ({
      verified: items.filter(isVerified),
      featured: items.filter(isFeatured),
      trending: [...items].sort(
        (a, b) => getInterestCount(b) + getViews(b) - (getInterestCount(a) + getViews(a))
      ),
      newest: [...items].sort((a, b) => getTimestamp(b) - getTimestamp(a)),
      active: items.filter(isRecentlyActive),
    });
    return { startups: build(startups), investors: build(investors) };
  }, [startups, investors]);

  const activeSections = primaryMode === "startups" ? sections.startups : sections.investors;

  /* ---------- platform-wide stats (shown regardless of role) ---------- */

  const stats = useMemo(() => {
    const totalFundingRaised = startups.reduce((sum, s) => sum + getRaised(s), 0);
    const activeDeals = startups.filter(
      (s) => s?.status === "active" || s?.dealStatus === "active" || isRecentlyActive(s)
    ).length;
    return {
      totalStartups: startups.length,
      totalInvestors: investors.length,
      activeDeals,
      totalFundingRaised,
    };
  }, [startups, investors]);

  const availableIndustries = useMemo(() => {
    const set = new Set();
    primaryItems.forEach((item) => {
      const industries = Array.isArray(item?.industries)
        ? item.industries
        : [item?.industry].filter(Boolean);
      industries.forEach((i) => i && set.add(i));
    });
    return Array.from(set).sort();
  }, [primaryItems]);

  const availableCountries = useMemo(() => {
    const set = new Set();
    primaryItems.forEach((item) => item?.country && set.add(item.country));
    return Array.from(set).sort();
  }, [primaryItems]);

  /* ---------- handlers ---------- */

  const handleSearch = ({ query, scope }) => {
    setSearchQuery(query);
    setSearchScope(scope);
  };

  const handleFilterChange = (nextFilters) => setFilters(nextFilters);

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
  };

  const handleLoadMore = () => setVisibleCount((prev) => prev + PAGE_SIZE);

  const hasAnyFilterActive =
    debouncedQuery.length > 0 ||
    Object.entries(filters).some(([key, value]) => DEFAULT_FILTERS[key] !== value);

  const entityLabel = primaryMode === "startups" ? "startup" : "investor";
  const entityLabelPlural = primaryMode === "startups" ? "startups" : "investors";

  return (
    <AppShell
      title="Discover"
      subtitle={
        primaryMode === "startups"
          ? "Explore startups actively raising and matched to your investment thesis."
          : "Explore investors actively deploying capital in your industry and stage."
      }
    >
      <div className="space-y-8">
        <DiscoverHero
          role={role}
          stats={stats}
          searchQuery={searchQuery}
          searchScope={searchScope}
          onSearch={handleSearch}
          loading={loading}
        />

        {loadError && (
          <EmptyState
            variant="error"
            title="We couldn't load Discover"
            description={loadError}
            actionLabel="Try again"
            onAction={loadData}
          />
        )}

        {!loadError && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
            <DiscoverFilters
              mode={primaryMode}
              filters={filters}
              onChange={handleFilterChange}
              onReset={handleResetFilters}
              industries={availableIndustries}
              countries={availableCountries}
              sortBy={sortBy}
              onSortChange={setSortBy}
              sortOptions={SORT_OPTIONS}
              mobileOpen={mobileFiltersOpen}
              onMobileClose={() => setMobileFiltersOpen(false)}
            />

            <div className="min-w-0 space-y-10">
              {loading ? (
                <LoadingSkeleton mode={primaryMode} count={8} />
              ) : hasAnyFilterActive ? (
                <section>
                  <SectionHeader
                    title="Search Results"
                    subtitle={`${filteredResults.length} ${entityLabelPlural} found`}
                    onOpenFilters={() => setMobileFiltersOpen(true)}
                  />
                  {visibleResults.length > 0 ? (
                    <>
                      <DiscoverGrid mode={primaryMode} items={visibleResults} />
                      {hasMore && (
                        <div className="mt-6 flex justify-center">
                          <button
                            type="button"
                            onClick={handleLoadMore}
                            className="rounded-md border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--text-main)] shadow-sm transition hover:border-[var(--primary)]/40 hover:bg-[var(--surface)]"
                          >
                            Load more
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyState
                      variant="no-results"
                      title="No matches yet"
                      description="Try adjusting your search or filters to see more results."
                      actionLabel="Clear filters"
                      onAction={handleResetFilters}
                    />
                  )}
                </section>
              ) : (
                <>
                  {activeSections.featured.length > 0 && (
                    <section>
                      <SectionHeader
                        title={primaryMode === "startups" ? "Featured Startups" : "Featured Investors"}
                        subtitle="Hand-picked by our team"
                        onOpenFilters={() => setMobileFiltersOpen(true)}
                      />
                      <DiscoverGrid mode={primaryMode} items={activeSections.featured.slice(0, 8)} />
                    </section>
                  )}

                  <section>
                    <SectionHeader
                      title={primaryMode === "startups" ? "Trending Startups" : "Trending Investors"}
                      subtitle="Gaining the most attention right now"
                    />
                    {activeSections.trending.length > 0 ? (
                      <DiscoverGrid mode={primaryMode} items={activeSections.trending.slice(0, 8)} />
                    ) : (
                      <EmptyState
                        variant="no-results"
                        title={`No ${entityLabelPlural} yet`}
                        description="Check back soon as the platform grows."
                      />
                    )}
                  </section>

                  <section>
                    <SectionHeader
                      title={primaryMode === "startups" ? "Newly Published Startups" : "Newly Joined Investors"}
                      subtitle="Fresh on the platform"
                    />
                    <DiscoverGrid mode={primaryMode} items={activeSections.newest.slice(0, 8)} />
                  </section>

                  {activeSections.verified.length > 0 && (
                    <section>
                      <SectionHeader
                        title={primaryMode === "startups" ? "Verified Startups" : "Verified Investors"}
                        subtitle="Identity and credentials confirmed"
                      />
                      <DiscoverGrid mode={primaryMode} items={activeSections.verified.slice(0, 8)} />
                    </section>
                  )}

                  {activeSections.active.length > 0 && (
                    <section>
                      <SectionHeader
                        title={primaryMode === "startups" ? "Recently Active Startups" : "Active Investors"}
                        subtitle="Engaged on the platform this week"
                      />
                      <DiscoverGrid mode={primaryMode} items={activeSections.active.slice(0, 8)} />
                    </section>
                  )}

                  <section>
                    <SectionHeader
                      title="All"
                      subtitle={`Browse every ${entityLabel} on the platform`}
                    />
                    {visibleResults.length > 0 ? (
                      <>
                        <DiscoverGrid mode={primaryMode} items={visibleResults} />
                        {hasMore && (
                          <div className="mt-6 flex justify-center">
                            <button
                              type="button"
                              onClick={handleLoadMore}
                              className="rounded-md border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--text-main)] shadow-sm transition hover:border-[var(--primary)]/40 hover:bg-[var(--surface)]"
                            >
                              Load more
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <EmptyState
                        variant="no-results"
                        title={`No ${entityLabelPlural} yet`}
                        description="Once people join the platform, they'll show up here."
                      />
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         