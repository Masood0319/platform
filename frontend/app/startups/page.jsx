"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { FilterBar } from "@/components/startups/FilterBar";
import { SearchBar } from "@/components/startups/SearchBar";
import { StartupGrid } from "@/components/startups/StartupGrid";
import { getStartups } from "@/lib/services/startupService";
import { expressInterest } from "@/lib/services/interestService";
import { showToast } from "@/lib/toast";
import { useUser } from "@/components/providers/UserProvider";

const filterChips = ["AI", "Fintech", "Health", "SaaS", "Seed", "Series A"];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value || 0);
}

export default function StartupsPage() {
  const [search, setSearch] = useState("");
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [startups, setStartups] = useState([]);
  const [interestStatuses, setInterestStatuses] = useState({});
  const [loadingInterestIds, setLoadingInterestIds] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useUser();

  // Normalize backend startup to frontend-expected shape
  const normalizeStartup = (raw) => {
    // Map backend sector (single string) to frontend industryTags (array)
    const sectors = raw.sector ? [raw.sector] : [];
    const industryTags = raw.industryTags || raw.industries || sectors;

    // Map backend registrationCountry / city to location
    const location = raw.location || raw.city || raw.registrationCountry || '—';

    return {
      ...raw,
      id: raw._id || raw.id,
      name: raw.name || raw.startupName || '',
      industryTags,
      location,
      fundingTarget: raw.fundingTarget || raw.target || 0,
      fundingRaised: raw.fundingRaised || raw.raised || 0,
      investorsInterested: raw.investorsInterested ?? raw.interestCount ?? 0,
    };
  };

  // ✅ FETCH DATA
  useEffect(() => {
    async function fetchStartups() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getStartups();

        // 🔥 ensure it's always an array and normalize fields
        const normalized = (Array.isArray(data) ? data : []).map(normalizeStartup);
        setStartups(normalized);
      } catch (err) {
        console.error(err);
        setError("Failed to load startups. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStartups();
  }, []);

  // ✅ FILTERING
  const filteredStartups = useMemo(() => {
    const query = search.trim().toLowerCase();

    return startups.filter((startup) => {
      const matchesSearch =
        query.length === 0 ||
        startup.name?.toLowerCase().includes(query) ||
        startup.tagline?.toLowerCase().includes(query) ||
        startup.location?.toLowerCase().includes(query) ||
        startup.industryTags?.some((tag) =>
          tag.toLowerCase().includes(query)
        );

      const stageFilters = selectedFilters.filter((f) =>
        ["Seed", "Series A"].includes(f)
      );

      const industryFilters = selectedFilters.filter(
        (f) => !["Seed", "Series A"].includes(f)
      );

      // Normalize stage for comparison (backend uses lowercase)
      const stage = startup.stage || '';
      const stageLabel =
        stage === 'pre-seed' ? 'Pre-seed' :
        stage === 'seed' ? 'Seed' :
        stage === 'series-a' ? 'Series A' :
        stage === 'series-b' ? 'Series B' :
        stage === 'series-c' ? 'Series C+' : stage;

      const matchesStage =
        stageFilters.length === 0 ||
        stageFilters.includes(stageLabel);

      const matchesIndustry =
        industryFilters.length === 0 ||
        industryFilters.some((f) =>
          startup.industryTags?.includes(f)
        );

      return matchesSearch && matchesStage && matchesIndustry;
    });
  }, [search, selectedFilters, startups]);

  // ✅ STATS (FIXED)
  const stats = useMemo(() => {
    const safe = Array.isArray(startups) ? startups : [];

    const totalTarget = safe.reduce(
      (sum, s) => sum + (s.fundingTarget || 0),
      0
    );

    const avgTarget =
      safe.length > 0 ? totalTarget / safe.length : 0;

    const totalInterested = safe.reduce(
      (sum, s) => sum + (s.investorsInterested || 0),
      0
    );

    return {
      avgTarget,
      totalInterested,
    };
  }, [startups]);

  // ✅ HANDLERS
  const handleToggleFilter = (filter) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const handleExpressInterest = useCallback(
    async (startup) => {
      const startupId = startup?.id || startup?._id;
      const receiverId = startup?.ownerId?._id || startup?.ownerId;
      const senderId = user?._id || user?.id;

      if (!startupId || !receiverId) {
        showToast("Unable to identify the startup owner.");
        return;
      }

      if (!user?.role) {
        showToast("Unable to send interest without a valid role.");
        return;
      }

      if (senderId && receiverId.toString() === senderId.toString()) {
        showToast("You cannot express interest in your own startup.");
        return;
      }

      if (loadingInterestIds.has(startupId)) {
        return;
      }

      setLoadingInterestIds((prev) => new Set(prev).add(startupId));

      try {
        const interest = await expressInterest({
          receiverId,
          receiverRole: "founder",
          senderRole: String(user.role).toLowerCase(),
          startupId,
        });

        setInterestStatuses((prev) => ({
          ...prev,
          [startupId]: interest?.status || "pending",
        }));
        showToast("Interest request sent!");
      } catch (err) {
        console.error("Failed to send interest request:", err);
        showToast(err?.message || "Failed to send interest request");
      } finally {
        setLoadingInterestIds((prev) => {
          const next = new Set(prev);
          next.delete(startupId);
          return next;
        });
      }
    },
    [user, loadingInterestIds]
  );

  return (
    <AppShell
      title="Discover Startups"
      subtitle="Explore high-potential startups raising funding"
    >
      {/* HEADER */}
      <section className="relative max-w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-slate-100 md:p-10">
        <div className="relative space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Startup Discovery
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
                Curated deal flow with momentum signals
              </h2>
              <p className="mt-3 text-sm text-slate-300">
                Compare traction, stage, and investor signals across startups.
              </p>
            </div>

            {/* STATS */}
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300 sm:grid-cols-3">
              <div>
                <p className="text-[11px] text-slate-400">Active Deals</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {startups.length}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400">Avg Target</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {formatCurrency(stats.avgTarget)}
                </p>
              </div>

              <div>
                <p className="text-[11px] text-slate-400">
                  Investor Signals
                </p>
                <p className="mt-2 flex items-center gap-2 text-base font-semibold text-white">
                  <Sparkles size={16} className="text-emerald-300" />
                  {stats.totalInterested}
                </p>
              </div>
            </div>
          </div>

          {/* SEARCH */}
          <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
            <SearchBar value={search} onChange={setSearch} />

            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300">
              <span>
                Showing{" "}
                <span className="text-white">
                  {filteredStartups.length}
                </span>{" "}
                of {startups.length}
              </span>
            </div>
          </div>

          {/* FILTERS */}
          <FilterBar
            filters={filterChips}
            selected={selectedFilters}
            onToggle={handleToggleFilter}
            onClear={() => setSelectedFilters([])}
          />
        </div>
      </section>

      {/* CONTENT */}
      <div className="mt-8">
        {error ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-300">
            {error}
          </div>
        ) : !isLoading && filteredStartups.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-sm text-slate-300">
            No startups found.
          </div>
        ) : (
          <StartupGrid
            startups={filteredStartups}
            onExpressInterest={handleExpressInterest}
            interestStatuses={interestStatuses}
            loadingInterest={loadingInterestIds}
            isLoading={isLoading}
          />
        )}
      </div>
    </AppShell>
  );
}
