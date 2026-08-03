"use client";

import { cn } from "@/lib/utils";

export function IndustrySelector({ options = [], value, onChange, className }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200",
              isSelected
                ? "bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white shadow-lg shadow-[var(--primary)]/25"
                : "border border-white/30 bg-white/30 text-[var(--text-muted)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}