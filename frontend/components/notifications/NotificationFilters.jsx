const filterOptions = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "investment", label: "Investments" },
  { id: "message", label: "Messages" },
];

export function NotificationFilters({ activeFilter, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {filterOptions.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`min-h-[44px] rounded-full border px-4 py-1.5 text-sm font-medium transition ${
            activeFilter === option.id
              ? "border-transparent bg-[var(--primary)] text-white shadow-sm"
              : "border-[var(--border)] bg-white text-[var(--text-muted)] hover:border-[var(--primary)]/40 hover:text-[var(--text-main)]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
