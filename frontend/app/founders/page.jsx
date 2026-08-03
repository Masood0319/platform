"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  MapPin,
  CheckCircle2,
  Building2,
  Lightbulb,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { getFounders } from "@/lib/services/userService";
import { showToast } from "@/lib/toast";

export const dynamic = "force-dynamic";

/* ─── helpers ─── */
function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function uniqueValues(arr) {
  return Array.from(new Set(arr.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  );
}

/* ─── FounderCard ─── */
function FounderCard({ founder }) {
  const si = founder.profile?.startupInfo || {};
  const industries = founder.profile?.industries || [];

  return (
    <Card className="flex flex-col gap-4 hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start gap-3">
        {founder.avatar ? (
          <img
            src={founder.avatar}
            alt={founder.name}
            className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-semibold text-[var(--primary)]">
            {getInitials(founder.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <CardTitle className="truncate text-base">{founder.name}</CardTitle>
            {founder.isVerified && (
              <CheckCircle2
                size={15}
                className="flex-shrink-0 text-[var(--accent)]"
              />
            )}
          </div>
          {si.companyName && (
            <p className="text-sm font-medium text-[var(--text-main)] truncate">
              {si.companyName}
            </p>
          )}
          {founder.location && (
            <p className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
              <MapPin size={11} />
              {founder.location}
            </p>
          )}
        </div>

        {si.stage && (
          <Badge variant="secondary" className="flex-shrink-0 capitalize">
            {si.stage}
          </Badge>
        )}
      </div>

      {/* Tagline / description */}
      {si.description && (
        <p className="text-sm text-[var(--text-muted)] line-clamp-2">
          {si.description}
        </p>
      )}

      {/* Bio */}
      {!si.description && founder.profile?.bio && (
        <p className="text-sm text-[var(--text-muted)] line-clamp-2">
          {founder.profile.bio}
        </p>
      )}

      {/* Industries */}
      {industries.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {industries.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Funding info */}
      {si.fundingNeeded && (
        <div className="flex items-center gap-1.5 rounded-lg bg-[var(--surface)] px-3 py-2 text-xs text-[var(--text-muted)] font-medium">
          <Lightbulb size={13} className="text-[var(--primary)]" />
          <span>
            Raising{" "}
            <span className="font-semibold text-[var(--text-main)]">
              {si.fundingNeeded}
            </span>
          </span>
        </div>
      )}
    </Card>
  );
}

/* ─── Loading skeleton ─── */
function FounderSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-[var(--border)] bg-white p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-3 bg-gray-100 rounded w-1/2" />
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded w-full" />
      <div className="h-3 bg-gray-100 rounded w-5/6" />
    </div>
  );
}

/* ─── Page ─── */
export default function FoundersPage() {
  const [founders, setFounders] = useState([]);
  const [loading, setLoading] = useState(true);

  /* search & filters */
  const [search, setSearch] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedStage, setSelectedStage] = useState("");

  /* fetch */
  useEffect(() => {
    async function load() {
      try {
        const data = await getFounders();
        setFounders(data || []);
      } catch (err) {
        console.error(err);
        showToast("Failed to load founders");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* filter options */
  const industryOptions = useMemo(
    () => uniqueValues(founders.flatMap((f) => f.profile?.industries || [])),
    [founders]
  );
  const stageOptions = useMemo(
    () =>
      uniqueValues(
        founders.map((f) => f.profile?.startupInfo?.stage).filter(Boolean)
      ),
    [founders]
  );

  /* client-side filtering */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return founders.filter((f) => {
      const si = f.profile?.startupInfo || {};
      const matchSearch =
        !q ||
        (f.name || "").toLowerCase().includes(q) ||
        (si.companyName || "").toLowerCase().includes(q) ||
        (si.description || "").toLowerCase().includes(q) ||
        (f.profile?.bio || "").toLowerCase().includes(q);

      const matchIndustry =
        !selectedIndustry ||
        (f.profile?.industries || []).includes(selectedIndustry);

      const matchStage =
        !selectedStage || si.stage === selectedStage;

      return matchSearch && matchIndustry && matchStage;
    });
  }, [founders, search, selectedIndustry, selectedStage]);

  return (
    <AppShell
      title="Discover Founders"
      subtitle="Discover founders building the next generation of startups"
    >
      {/* Hero banner */}
      <section className="relative max-w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 p-6 text-slate-100 md:p-10">
        <div className="relative space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Founder Discovery
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
                Meet the builders behind tomorrow's breakout companies
              </h2>
              <p className="mt-3 text-sm text-slate-300">
                Browse verified founders, explore their startups, and discover your next partners.
              </p>
            </div>

            {/* Stats */}
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300 sm:grid-cols-2">
              <div>
                <p className="text-[11px] text-slate-400">Active Founders</p>
                <p className="mt-2 text-base font-semibold text-white">
                  {loading ? "—" : founders.length}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">Showing</p>
                <p className="mt-2 flex items-center gap-2 text-base font-semibold text-white">
                  <Building2 size={16} className="text-emerald-300" />
                  {loading ? "—" : filtered.length}
                </p>
              </div>
            </div>
          </div>

          {/* Search + filters */}
          <div className="flex flex-col gap-3 md:flex-row">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search founders, startups, descriptions…"
                className="w-full rounded-xl border border-white/10 bg-white/10 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-400 outline-none focus:border-white/30 focus:bg-white/15 transition-colors"
              />
            </div>

            {/* Industry filter */}
            {industryOptions.length > 0 && (
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30 focus:bg-white/15 transition-colors"
              >
                <option value="">All Industries</option>
                {industryOptions.map((opt) => (
                  <option key={opt} value={opt} className="text-black">
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {/* Stage filter */}
            {stageOptions.length > 0 && (
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-white/30 focus:bg-white/15 transition-colors"
              >
                <option value="">All Stages</option>
                {stageOptions.map((opt) => (
                  <option key={opt} value={opt} className="text-black capitalize">
                    {opt}
                  </option>
                ))}
              </select>
            )}

            {/* Clear */}
            {(search || selectedIndustry || selectedStage) && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedIndustry("");
                  setSelectedStage("");
                }}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Grid */}
      <div className="mt-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <FounderSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-[var(--border)] bg-white p-12 text-center">
            <Users size={40} className="text-[var(--text-muted)]" />
            <div>
              <p className="font-medium text-[var(--text-main)]">
                {founders.length === 0
                  ? "No founders have joined yet"
                  : "No founders match your search"}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {founders.length === 0
                  ? "Check back soon as the community grows."
                  : "Try adjusting your filters or search term."}
              </p>
            </div>
            {(search || selectedIndustry || selectedStage) && (
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedIndustry("");
                  setSelectedStage("");
                }}
                className="text-sm text-[var(--primary)] underline underline-offset-4"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((founder) => (
              <FounderCard
                key={founder._id}
                founder={founder}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
