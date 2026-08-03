"use client";

import { cn } from "@/lib/utils";

export function GlassCard({ children, className, title, description, icon: Icon }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl",
        "shadow-[0_8px_32px_rgba(0,0,0,0.08)]",
        className
      )}
    >
      {title && (
        <div className="border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)]">
                <Icon className="h-4 w-4 text-white" size={16} />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-main)]">{title}</h3>
              {description && (
                <p className="text-sm text-[var(--text-muted)]">{description}</p>
              )}
            </div>
          </div>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}