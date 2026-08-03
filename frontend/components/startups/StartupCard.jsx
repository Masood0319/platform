"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Check, MapPin, Users } from "lucide-react";
import { InterestButton } from "@/components/ui/interest-button";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

const stageStyles = {
  Seed: "border-amber-300/40 bg-amber-400/15 text-amber-200",
  "Series A": "border-sky-300/40 bg-sky-400/15 text-sky-200",
  "Series B": "border-violet-300/40 bg-violet-400/15 text-violet-200",
};

export function StartupCard({ startup, interestStatus, interestLoading = false, onExpressInterest }) {
  const startupId = startup?.id || startup?._id;
  const industry = startup.industry || startup.industryTags || [];
  const raised = startup.raised ?? startup.fundingRaised ?? 0;
  const target = startup.target ?? startup.fundingTarget ?? 0;
  const logo = startup.logo || {
    label: String(startup?.name || "").slice(0, 2).toUpperCase(),
    gradient: "from-slate-200 to-slate-400",
  };

  const progressValue = useMemo(() => {
    if (!target) return 0;
    return Math.min(Math.round((raised / target) * 100), 100);
  }, [raised, target]);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setProgress(progressValue), 120);
    return () => clearTimeout(timeout);
  }, [progressValue]);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_70px_-40px_rgba(15,23,42,0.9)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:shadow-[0_30px_90px_-35px_rgba(56,189,248,0.35)]">
      <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-500/15 via-transparent to-emerald-400/10 opacity-0 transition duration-300 group-hover:opacity-100" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${logo.gradient} text-sm font-semibold text-slate-950 shadow-lg`}
          >
            {logo.label}
          </div>
          <div>
            <p className="text-lg font-semibold text-white">{startup.name}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{startup.stage}</p>
          </div>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
            stageStyles[startup.stage] ?? "border-white/20 bg-white/10 text-slate-200"
          }`}
        >
          {startup.stage}
        </span>
      </div>

      <p className="relative mt-4 text-sm text-slate-300">
        {startup.tagline}
      </p>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {industry.map((tag) => (
          <button
            key={tag}
            type="button"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-slate-200 transition hover:border-white/30 hover:bg-white/10"
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="relative mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Raised {formatCurrency(raised)} of {formatCurrency(target)}
          </span>
          <span className="text-slate-300">{progressValue}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-emerald-400 transition-[width] duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <MapPin size={14} className="text-slate-500" />
          <span>{startup.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={14} className="text-slate-500" />
          <span>{startup.investorsInterested || 0} investors interested</span>
        </div>
      </div>

      <div className="relative mt-6 flex items-center gap-3">
        <Link
          href={`/startup/${startupId}`}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-100"
        >
          View Details
          <ArrowUpRight size={14} />
        </Link>
        <InterestButton
          status={interestStatus}
          loading={interestLoading}
          onClick={onExpressInterest}
          disabled={!onExpressInterest}
        />
      </div>
    </div>
  );
}
