// components/discover/EmptyState.jsx

import { SearchX, AlertTriangle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const VARIANT_CONFIG = {
  "no-results": {
    icon: SearchX,
    iconClass: "text-[var(--text-muted)]",
    bgClass: "bg-[var(--surface)]",
  },
  error: {
    icon: AlertTriangle,
    iconClass: "text-red-500",
    bgClass: "bg-red-50",
  },
  empty: {
    icon: Inbox,
    iconClass: "text-[var(--text-muted)]",
    bgClass: "bg-[var(--surface)]",
  },
};

/**
 * EmptyState
 * Shared empty/error/no-results state for Discover. `variant` controls the
 * icon and tint; `title`/`description` are always provided by the caller
 * (page.jsx) so no copy is invented here.
 */
export default function EmptyState({
  variant = "empty",
  title,
  description,
  actionLabel,
  onAction,
}) {
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.empty;
  const Icon = config.icon;

  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div
        className={`flex h-14 w-14 items-center justify-center rounded-full ${config.bgClass}`}
        aria-hidden="true"
      >
        <Icon size={24} className={config.iconClass} />
      </div>

      <div className="max-w-sm space-y-1">
        <h3 className="text-base font-semibold text-[var(--text-main)]">{title}</h3>
        {description && (
          <p className="text-sm text-[var(--text-muted)]">{description}</p>
        )}
      </div>

      {actionLabel && onAction && (
        <Button type="button" variant="outline" size="sm" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}