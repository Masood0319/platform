// components/discover/LoadingSkeleton.jsx

import { Card } from "@/components/ui/card";

function SkeletonBlock({ className }) {
  return <div className={`animate-pulse rounded-md bg-[var(--border)]/60 ${className}`} />;
}

function StartupSkeletonCard() {
  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <SkeletonBlock className="h-10 w-10 flex-shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
        </div>
        <SkeletonBlock className="h-5 w-14 flex-shrink-0 rounded-md" />
      </div>
      <div className="flex gap-1.5">
        <SkeletonBlock className="h-5 w-14 rounded-md" />
        <SkeletonBlock className="h-5 w-16 rounded-md" />
      </div>
      <div className="space-y-2">
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-2 w-full rounded-full" />
      </div>
      <div className="flex justify-between">
        <SkeletonBlock className="h-3 w-20" />
        <SkeletonBlock className="h-3 w-16" />
      </div>
      <div className="flex gap-2 pt-2">
        <SkeletonBlock className="h-8 w-full rounded-lg" />
        <SkeletonBlock className="h-8 w-full rounded-lg" />
      </div>
    </Card>
  );
}

function InvestorSkeletonCard() {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="h-9 w-9 flex-shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-2/3" />
          <div className="flex gap-1.5">
            <SkeletonBlock className="h-4 w-12 rounded-md" />
            <SkeletonBlock className="h-4 w-12 rounded-md" />
          </div>
        </div>
      </div>
    </Card>
  );
}

/**
 * LoadingSkeleton
 * Placeholder grid shown while Discover data loads. Mirrors the layout of
 * StartupCard (detailed) vs InvestorCard (compact) so there's no layout
 * shift once real data arrives.
 */
export default function LoadingSkeleton({ mode = "startups", count = 8 }) {
  const items = Array.from({ length: count });
  const SkeletonCard = mode === "startups" ? StartupSkeletonCard : InvestorSkeletonCard;

  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      role="status"
      aria-label="Loading results"
    >
      {items.map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}