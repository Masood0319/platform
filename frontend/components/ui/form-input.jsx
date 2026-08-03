"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const FormInput = forwardRef(({ label, error, className, ...props }, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-sm font-medium text-[var(--text-main)]">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-lg border border-[var(--border)] bg-white px-4 text-sm outline-none",
          "placeholder:text-slate-400",
          "transition-all duration-200",
          "focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20",
          error && "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
});

FormInput.displayName = "FormInput";

export { FormInput };
