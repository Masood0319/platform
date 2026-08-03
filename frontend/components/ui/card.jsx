import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[var(--border)] bg-white p-5",
        className
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }) {
  return <h3 className={cn("font-semibold text-[var(--text-main)] tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
  return <p className={cn("text-sm text-[var(--text-muted)]", className)} {...props} />;
}
