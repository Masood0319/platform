"use client";

import { StartupCard } from "@/components/startups/StartupCard";

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="skeleton absolute inset-0 opacity-40" />
      <div className="relative space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-12 w-12 rounded-2xl bg-white/10" />
          <div className="h-6 w-20 rounded-full bg-white/10" />
        </div>
        <div className="h-4 w-40 rounded-full bg-white/10" />
        <div className="h-3 w-56 rounded-full bg-white/10" />
        <div className="h-2 w-full rounded-full bg-white/10" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-white/10" />
          <div className="h-6 w-20 rounded-full bg-white/10" />
          <div className="h-6 w-14 rounded-full bg-white/10" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-full rounded-full bg-white/10" />
          <div className="h-9 w-full rounded-full bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export function StartupGrid({ startups, onExpressInterest, interestStatuses = {}, loadingInterest = new Set(), isLoading }) {
  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonCard key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {startups.map((startup) => {
        const startupId = startup.id || startup._id;
        return (
          <StartupCard
            key={startupId}
            startup={startup}
            interestStatus={interestStatuses[startupId]}
            interestLoading={loadingInterest.has(startupId)}
            onExpressInterest={() => onExpressInterest?.(startup)}
          />
        );
      })}
    </div>
  );
}
