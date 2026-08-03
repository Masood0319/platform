import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const selectClasses =
  "h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-main)] outline-none focus:border-[var(--primary)]";

export function InvestorSearchBar({
  filters,
  onFiltersChange,
  industryOptions,
  rangeOptions,
  locationOptions,
}) {
  const updateFilter = (key) => (event) => {
    onFiltersChange({ ...filters, [key]: event.target.value });
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        <label className="relative flex items-center sm:col-span-2">
          <Search className="absolute left-3 text-[var(--text-muted)]" size={16} />
          <Input
            value={filters.search}
            onChange={updateFilter("search")}
            placeholder="Search investors by name or industry"
            className="pl-9"
            aria-label="Search investors"
          />
        </label>

        <label className="sr-only" htmlFor="industry-filter">
          Industry interest
        </label>
        <select
          id="industry-filter"
          value={filters.industry}
          onChange={updateFilter("industry")}
          className={cn(selectClasses)}
        >
          <option value="">Industry interest</option>
          {industryOptions.map((industry) => (
            <option key={industry} value={industry}>
              {industry}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="range-filter">
          Investment range
        </label>
        <select
          id="range-filter"
          value={filters.range}
          onChange={updateFilter("range")}
          className={cn(selectClasses)}
        >
          <option value="">Investment range</option>
          {rangeOptions.map((range) => (
            <option key={range} value={range}>
              {range}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="location-filter">
          Location
        </label>
        <select
          id="location-filter"
          value={filters.location}
          onChange={updateFilter("location")}
          className={cn(selectClasses)}
        >
          <option value="">Location</option>
          {locationOptions.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
