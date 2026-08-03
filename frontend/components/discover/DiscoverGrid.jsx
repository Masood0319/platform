// components/discover/DiscoverGrid.jsx

import { useRouter } from "next/navigation";
import { StartupCard } from "@/components/startup-card";
import { InvestorCard } from "@/components/investor-card";

/* ============================================================================
 * ADAPTERS
 * StartupCard / InvestorCard expect a specific prop shape. These functions
 * only READ alternate field names your API might use (mirroring the same
 * defensive pattern used in app/discover/page.jsx) — they never fabricate
 * values. If your real schema field names differ, adjust the `??` chains
 * below rather than the card components themselves.
 * ========================================================================== */

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function toStartupCardProps(raw) {
  const id = raw?.id || raw?._id;
  const industry = Array.isArray(raw?.industry)
    ? raw.industry
    : Array.isArray(raw?.industries)
      ? raw.industries
      : [raw?.industry].filter(Boolean);

  return {
    id,
    name: raw?.name || raw?.startupName || "",
    tagline: raw?.tagline || raw?.shortDescription || raw?.description || "",
    logo: raw?.logo?.label
      ? raw.logo
      : { label: getInitials(raw?.name || raw?.startupName || "") },
    stage: raw?.stage || raw?.fundingStage || "—",
    industry,
    raised: Number(raw?.raised ?? raw?.raisedAmount ?? raw?.amountRaised ?? raw?.fundingRaised ?? 0) || 0,
    target: Number(raw?.target ?? raw?.fundingGoal ?? raw?.goalAmount ?? raw?.targetAmount ?? 0) || 0,
    location: raw?.location || raw?.country || "—",
    investorsInterested: Number(raw?.investorsInterested ?? raw?.interestCount ?? raw?.interestedCount ?? 0) || 0,
  };
}

function toInvestorCardProps(raw) {
  const id = raw?.id || raw?._id;
  // Backend stores investor-specific data in `investorProfile` sub-document
  const ip = raw?.investorProfile || {};
  // investmentRange is an object { min, max } — format as a display string
  const rangeVal = ip.investmentRange;
  const rangeStr = rangeVal
    ? `$${(rangeVal.min || 0).toLocaleString()} - $${(rangeVal.max || 0).toLocaleString()}`
    : raw?.range || "";

  return {
    id,
    name: raw?.name || raw?.fullName || "",
    type: ip.firmName || raw?.type || raw?.investorType || raw?.company || "",
    location: raw?.location || raw?.country || "",
    range: rangeStr,
    industries: Array.isArray(ip.industries)
      ? ip.industries
      : Array.isArray(raw?.industries)
        ? raw.industries
        : [raw?.industry].filter(Boolean),
    verified: Boolean(raw?.verified ?? raw?.isVerified),
    bio: raw?.bio || raw?.about || "",
  };
}

/**
 * DiscoverGrid
 * Responsive card grid for either startups or investors. Data mapping to
 * the underlying card components happens here so page.jsx and the card
 * components themselves stay decoupled from raw API field names.
 */
export default function DiscoverGrid({ mode = "startups", items = [] }) {
  const router = useRouter();

  if (!items || items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5 2xl:grid-cols-4">
      {mode === "startups"
        ? items.map((raw) => {
            const startup = toStartupCardProps(raw);
            return (
              <StartupCard
                key={startup.id}
                startup={startup}
                variant="detailed"
                // Express Interest is intentionally left unwired: no
                // interest/matching service exists yet in this project.
                // InterestButton renders itself disabled without a handler.
              />
            );
          })
        : items.map((raw) => {
            const investor = toInvestorCardProps(raw);
            return (
              <InvestorCard
                key={investor.id}
                investor={investor}
                variant="detailed"
                onViewProfile={() => router.push(`/investors/${investor.id}`)}
              />
            );
          })}
    </div>
  );
}