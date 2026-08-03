import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--border)] bg-white px-3 text-sm outline-none ring-0 placeholder:text-slate-400 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)]/20",
        className
      )}
      {...props}
    />
  );
}
