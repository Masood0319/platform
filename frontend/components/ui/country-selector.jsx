"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

/**
 * Searchable single-select bound to a controlled list of {value, label}
 * options — normally fed from GET /api/startups/meta so the accepted
 * values can never drift from the backend enum.
 */
export function CountrySelector({ label, options = [], value, onChange, error, className }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className={cn("space-y-1.5", className)} ref={containerRef}>
      {label && <label className="text-sm font-medium text-[var(--text-main)]">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-lg border border-[var(--border)] bg-white px-4 text-left text-sm outline-none transition-all duration-200",
            "focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20",
            error && "border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20"
          )}
        >
          <span className={selected ? "text-[var(--text-main)]" : "text-slate-400"}>
            {selected ? selected.label : "Select a country"}
          </span>
          <ChevronDown size={16} className="text-slate-400" />
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
              <Search size={14} className="text-slate-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search countries..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")}>
                  <X size={14} className="text-slate-400" />
                </button>
              )}
            </div>
            <div className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-400">No countries match "{query}"</p>
              )}
              {filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center px-4 py-2 text-left text-sm hover:bg-[var(--surface)]",
                    opt.value === value && "bg-[var(--primary)]/10 font-medium text-[var(--primary)]"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}