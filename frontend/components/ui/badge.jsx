import { cn } from "@/lib/utils";

export function Badge({ className, children, variant = "default" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        variant === "default" && "border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)]",
        variant === "outline" && "border-[var(--border)] bg-white text-[var(--text-muted)]",
        variant === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        variant === "warning" && "border-amber-200 bg-amber-50 text-amber-700",
        variant === "danger" && "border-red-200 bg-red-50 text-red-700",
        className
      )}
    >
      {children}
    </span>
  );
}
