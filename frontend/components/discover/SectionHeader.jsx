// components/discover/SectionHeader.jsx

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * SectionHeader
 * Small heading used above every Discover content section (Featured,
 * Trending, Newest, Search Results, etc). On mobile, sections that pass
 * `onOpenFilters` also surface a "Filters" trigger that opens the
 * DiscoverFilters bottom sheet, since the sidebar is hidden below `lg`.
 */
export default function SectionHeader({ title, subtitle, onOpenFilters }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-lg font-semibold tracking-tight text-[var(--text-main)] md:text-xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">{subtitle}</p>
        )}
      </div>

      {onOpenFilters && (
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={onOpenFilters}
          className="flex-shrink-0 lg:hidden"
        >
          <SlidersHorizontal size={14} className="mr-1.5" aria-hidden="true" />
          Filters
        </Button>
      )}
    </div>
  );
}