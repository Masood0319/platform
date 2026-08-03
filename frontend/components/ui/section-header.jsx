import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  actions,
  align = "left",
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 md:flex-row md:items-end md:justify-between",
        align === "center" && "text-center md:items-center md:justify-center",
        className
      )}
    >
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {eyebrow}
          </p>
        )}
        {title && (
          <h2 className="text-xl font-semibold text-[var(--text-main)] md:text-2xl lg:text-3xl">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="mt-2 text-sm text-[var(--text-muted)] md:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
