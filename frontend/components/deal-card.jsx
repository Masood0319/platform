import { TrendingUp, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const STATUS_STYLES = {
  Requested: "bg-blue-50 text-blue-700",
  "Under Review": "bg-amber-50 text-amber-700",
  Negotiation: "bg-purple-50 text-purple-700",
  Closed: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function DealCard({
  startup,
  investor,
  amount,
  equity,
  status,
  onAccept,
  onReject,
  onNegotiate,
}) {
  const statusClass = STATUS_STYLES[status] || "bg-slate-100 text-slate-700";
  // Once a deal is closed or rejected, accept/reject no longer make sense
  const isFinal = status === "Closed" || status === "Rejected";

  return (
    <Card className="space-y-3 p-5 transition-colors hover:bg-[var(--surface)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="truncate">{startup}</CardTitle>
          <CardDescription className="truncate">Investor: {investor}</CardDescription>
        </div>
        <Badge className={`flex-shrink-0 ${statusClass}`}>{status}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-lg bg-[var(--surface)] p-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="flex-shrink-0 text-[var(--text-muted)]" />
          <div className="min-w-0">
            <p className="text-[11px] text-[var(--text-muted)]">Proposed</p>
            <p className="truncate text-sm font-semibold text-[var(--text-main)]">{amount}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Percent size={14} className="flex-shrink-0 text-[var(--text-muted)]" />
          <div className="min-w-0">
            <p className="text-[11px] text-[var(--text-muted)]">Equity</p>
            <p className="truncate text-sm font-semibold text-[var(--text-main)]">{equity}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {!isFinal && (
          <>
            <Button
              size="sm"
              variant="success"
              className="min-w-0 flex-1"
              onClick={onAccept}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="min-w-0 flex-1"
              onClick={onReject}
            >
              Reject
            </Button>
          </>
        )}
        {status !== "Closed" && status !== "Rejected" && (
          <Button
            size="sm"
            variant="secondary"
            className={isFinal ? "w-full" : "w-full sm:w-auto"}
            onClick={onNegotiate}
          >
            {status === "Negotiation" ? "Continue negotiation" : "Start negotiation"}
          </Button>
        )}
      </div>
    </Card>
  );
}