"use client";

export function FilterBar({ filters, selected, onToggle, onClear }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const isActive = selected.includes(filter);
        return (
          <button
            key={filter}
            type="button"
            onClick={() => onToggle?.(filter)}
            className={`rounded-full border px-4 py-2 text-xs font-medium uppercase tracking-wide transition ${
              isActive
                ? "border-sky-400/70 bg-sky-400/15 text-sky-200"
                : "border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:bg-white/10"
            }`}
          >
            {filter}
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => onClear?.()}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-300 transition hover:border-white/30 hover:bg-white/10"
        >
          Clear
        </button>
      )}
    </div>
  );
}
