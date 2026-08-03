"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

const FormSelect = forwardRef(({ label, options, error, className, ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-[var(--text-main)]">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "h-11 w-full appearance-none rounded-lg border border-[var(--border)] bg-white px-4 pr-10 text-sm outline-none",
            "transition-all duration-200",
            "focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20",
            error && "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20",
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          size={16}
        />
      </div>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
});

FormSelect.displayName = "FormSelect";

export { FormSelect };
