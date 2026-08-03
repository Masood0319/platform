import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InterestButton } from "@/components/ui/interest-button";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function StartupCard({
  startup,
  interested = [],
  onToggleInterested,
  interestStatus,
  interestLoading = false,
  onExpressInterest,
}) {
  const startupId = startup.id || startup._id;
  const isInterested = interested.includes(startupId);
  const status = interestStatus || (isInterested ? "pending" : null);

  return (
    <Card className="space-y-4 p-4 hover:shadow-md transition-shadow duration-200">
      {/* Header with logo/name and stage */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {startup.logo && (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white font-semibold text-sm flex-shrink-0">
              {startup.logo.label}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-lg text-[var(--text-main)] truncate">{startup.name}</h3>
            <p className="text-sm text-[var(--text-muted)] truncate">{startup.tagline}</p>
          </div>
        </div>
        <Badge variant="secondary" className="flex-shrink-0">{startup.stage}</Badge>
      </div>

      {/* Industry tags */}
      <div className="flex flex-wrap gap-1">
        {startup.industry.map((tag) => (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        ))}
      </div>

      {/* Funding progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">Raised</span>
          <span className="font-semibold text-[var(--primary)]">
            {formatCurrency(startup.raised)} / {formatCurrency(startup.target)}
          </span>
        </div>
        <div className="w-full bg-[var(--border)] rounded-full h-2">
          <div
            className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((startup.raised / startup.target) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Location and investors interested */}
      <div className="flex items-center justify-between text-sm text-[var(--text-muted)]">
        <div className="flex items-center gap-1">
          <MapPin size={14} />
          <span>{startup.location}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users size={14} />
          <span>{startup.investorsInterested} interested</span>
        </div>
      </div>

      {/* CTA buttons */}
      <div className="flex gap-2 pt-2">
        <Link href={`/startup/${startupId}`} className="flex-1">
          <Button size="sm" className="w-full">
            View Details
          </Button>
        </Link>
        <div className="flex-1">
          <InterestButton
            status={status}
            loading={interestLoading}
            onClick={onExpressInterest}
            disabled={!onExpressInterest}
          />
        </div>
      </div>
    </Card>
  );
}
