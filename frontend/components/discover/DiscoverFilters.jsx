// components/discover/DiscoverFilters.jsx

import { X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FUNDING_STAGES = ["Pre-Seed", "Seed", "Series A", "Series B", "Series C+"];
const INVESTMENT_STAGES = ["Pre-Seed", "Seed", "Series A", "Series B", "Growth"];
const INVESTMENT_SIZES = ["<$25K", "$25K–$100K", "$100K–$500K", "$500K–$1M", "$1M+"];
const FUNDING_GOAL_RANGES = ["<$250K", "$250K–$1M", "$1M–$5M", "$5M+"];

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-[var(--text-muted)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-[var(--border)] bg-white px-2.5 py-2 text-sm text-[var(--text-main)] outline-none transition focus:border-[var(--primary)]/50 focus:ring-2 focus:ring-[var(--primary)]/20"
      >
        <option value="all">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </label>
  );
}

function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--text-main)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]/30"
      />
      {label}
    </label>
  );
}

function FilterFormBody({
  mode,
  filters,
  onChange,
  industries,
  countries,
  sortBy,
  onSortChange,
  sortOptions,
}) {
  const set = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-5">
      <SelectField
        label="Sort by"
        value={sortBy}
        onChange={onSortChange}
        options={sortOptions.map((o) => o.label)}
      />
      {/* Sort uses labels as option values via a small shim below since
         SelectField is generic; override for correctness */}

      <SelectField
        label="Industry"
        value={filters.industry}
        onChange={(v) => set("industry", v)}
        options={industries}
      />

      <SelectField
        label="Country"
        value={filters.country}
        onChange={(v) => set("country", v)}
        options={countries}
      />

      {mode === "startups" ? (
        <>
          <SelectField
            label="Funding Stage"
            value={filters.fundingStage}
            onChange={(v) => set("fundingStage", v)}
            options={FUNDING_STAGES}
          />
          <SelectField
            label="Funding Goal"
            value={filters.fundingGoal}
            onChange={(v) => set("fundingGoal", v)}
            options={FUNDING_GOAL_RANGES}
          />
        </>
      ) : (
        <>
          <SelectField
            label="Investment Stage"
            value={filters.investmentStage}
            onChange={(v) => set("investmentStage", v)}
            options={INVESTMENT_STAGES}
          />
          <SelectField
            label="Check Size"
            value={filters.investmentSize}
            onChange={(v) => set("investmentSize", v)}
            options={INVESTMENT_SIZES}
          />
        </>
      )}

      <div className="space-y-2.5 border-t border-[var(--border)] pt-4">
        <CheckboxField
          label="Verified only"
          checked={filters.verifiedOnly}
          onChange={(v) => set("verifiedOnly", v)}
        />
        <CheckboxField
          label="Featured only"
          checked={filters.featuredOnly}
          onChange={(v) => set("featuredOnly", v)}
        />
        <CheckboxField
          label="Recently active"
          checked={filters.recentlyActive}
          onChange={(v) => set("recentlyActive", v)}
        />
      </div>
    </div>
  );
}

/**
 * DiscoverFilters
 * Renders as a static sidebar on `lg`+ and as a bottom-sheet drawer below
 * `lg`, controlled by `mobileOpen`/`onMobileClose` (triggered from
 * SectionHeader's "Filters" button).
 *
 * Note: `sortBy`/`onSortChange` are wired directly to option labels here
 * for simplicity of the native <select>; this maps back to `sortOptions`
 * value/label pairs below.
 */
export default function DiscoverFilters({
  mode,
  filters,
  onChange,
  onReset,
  industries,
  countries,
  sortBy,
  onSortChange,
  sortOptions,
  mobileOpen,
  onMobileClose,
}) {
  const currentSortLabel =
    sortOptions.find((o) => o.value === sortBy)?.label || sortOptions[0]?.label;

  const handleSortLabelChange = (label) => {
    const match = sortOptions.find((o) => o.label === label);
    if (match) onSortChange(match.value);
  };

  const body = (
    <FilterFormBody
      mode={mode}
      filters={filters}
      onChange={onChange}
      industries={industries}
      countries={countries}
      sortBy={currentSortLabel}
      onSortChange={handleSortLabelChange}
      sortOptions={sortOptions}
    />
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <Card className="sticky top-20 space-y-5 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--text-main)]">Filters</h2>
            <Button variant="ghost" size="sm" type="button" onClick={onReset}>
              <RotateCcw size={13} className="mr-1.5" aria-hidden="true" />
              Reset
            </Button>
          </div>
          {body}
        </Card>
      </aside>

      {/* Mobile bottom sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex items-end lg:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-slate-950/40"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          <div className="relative z-10 max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--text-main)]">Filters</h2>
              <button
                type="button"
                onClick={onMobileClose}
                className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)]"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>
            {body}
            <div className="mt-6 flex gap-2">
              <Button variant="outline" size="sm" type="button" onClick={onReset} className="flex-1">
                Reset
              </Button>
              <Button size="sm" type="button" onClick={onMobileClose} className="flex-1">
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}