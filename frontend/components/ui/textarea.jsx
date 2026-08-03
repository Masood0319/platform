import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-[var(--primary)]",
        className
      )}
      {...props}
    />
  );
}
