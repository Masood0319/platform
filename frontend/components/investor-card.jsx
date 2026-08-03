import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

import { cn } from "@/lib/utils";

const MAX_VISIBLE_TAGS = 4;

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function InvestorCard({
  investor,
  variant = "compact",
  onViewProfile,
}) {
  const isDetailed = variant === "detailed";
  const industries = investor.industries || [];
  const visibleTags = industries.slice(0, MAX_VISIBLE_TAGS);
  const hiddenTagCount = industries.length - visibleTags.length;

  return (
    <Card
      className={cn(
        "transition-colors hover:bg-[var(--surface)]",
        isDetailed ? "space-y-4 p-4 sm:p-5" : "space-y-3 p-3.5 sm:p-4"
      )}
    >
      {isDetailed ? (
        <div className="flex flex-wrap items-start gap-3 sm:flex-nowrap sm:gap-4">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-sm font-semibold text-[var(--primary)] sm:h-12 sm:w-12">
            {getInitials(investor.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate">{investor.name}</CardTitle>
              {investor.verified && (
                <CheckCircle2 className="flex-shrink-0 text-[var(--accent)]" size={16} />
              )}
            </div>
            {investor.type && (
              <p className="truncate text-sm text-[var(--text-muted)]">{investor.type}</p>
            )}
            {investor.location && (
              <p className="truncate text-xs text-[var(--text-muted)]">{investor.location}</p>
            )}
          </div>
          {investor.range && (
            <Badge className="w-fit sm:flex-shrink-0">{investor.range}</Badge>
          )}
        </div>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-xs font-semibold text-[var(--primary)]">
            {getInitials(investor.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="truncate text-base">{investor.name}</CardTitle>
              {investor.verified && (
                <CheckCircle2 className="flex-shrink-0 text-[var(--accent)]" size={14} />
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {investor.range && <Badge className="text-[11px]">{investor.range}</Badge>}
              {visibleTags.slice(0, 2).map((tag) => (
                <Badge key={tag} className="text-[11px]">
                  {tag}
                </Badge>
              ))}
              {industries.length > 2 && (
                <span className="text-xs text-[var(--text-muted)]">
                  +{industries.length - 2} more
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {isDetailed && (
        <>
          <div>
            <CardDescription>Preferred sectors</CardDescription>
            <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
              {visibleTags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
              {hiddenTagCount > 0 && (
                <Badge className="bg-transparent text-[var(--text-muted)]">
                  +{hiddenTagCount} more
                </Badge>
              )}
            </div>
          </div>

          {investor.bio && (
            <p className="line-clamp-3 text-sm leading-relaxed text-[var(--text-muted)]">
              {investor.bio}
            </p>
          )}
        </>
      )}

      {isDetailed && (
        <div className="flex flex-shrink-0 gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={onViewProfile}
            className="w-full sm:w-auto"
          >
            View Profile
          </Button>
        </div>
      )}
    </Card>
  );
}