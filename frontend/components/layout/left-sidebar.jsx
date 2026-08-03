"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/components/providers/UserProvider";
import { MapPin, Briefcase, CheckCircle2, ArrowUpRight } from "lucide-react";

const DASHBOARD_BY_ROLE = {
  founder: "/dashboard/founder",
  investor: "/dashboard/investor",
  advisor: "/dashboard/advisor",
  partner: "/dashboard/partner",
};

const PROFILE_BY_ROLE = {
  founder: "/profile/founder",
  investor: "/profile/investor",
  advisor: "/profile/advisor",
  partner: "/profile/partner",
};

function getInitials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

// Weighted completion check across fields that matter most for a usable
// profile, independent of role — keeps the calculation honest rather than
// hardcoding a percentage.
function getProfileCompletion(user) {
  const startupInfo = user.profile?.startupInfo || {};
  const checks = [
    !!user.avatar,
    !!user.profile?.bio,
    !!user.profile?.location,
    !!user.profile?.title,
    user.role === "founder" ? !!startupInfo.companyName : true,
    user.role === "founder" ? !!startupInfo.fundingNeeded : true,
    (user.profile?.industries || []).length > 0,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export function LeftSidebar() {
  const { user } = useUser();

  const completion = useMemo(() => (user ? getProfileCompletion(user) : 0), [user]);

  if (!user) return null;

  const startupInfo = user.profile?.startupInfo || {};
  const profileHref = PROFILE_BY_ROLE[user.role] || PROFILE_BY_ROLE.founder;
  const dashboardHref = DASHBOARD_BY_ROLE[user.role] || DASHBOARD_BY_ROLE.founder;
  const industries = user.profile?.industries || [];

  return (
    <aside className="space-y-4">
      <Card className="space-y-4 rounded-lg p-5">
        <Link href={profileHref} className="group flex items-center gap-3">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-base font-semibold text-[var(--primary)]">
              {getInitials(user.name)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate transition-colors group-hover:text-[var(--primary)]">
              {user.name}
            </CardTitle>
            <CardDescription className="capitalize">{user.role}</CardDescription>
          </div>
          <ArrowUpRight
            size={15}
            className="flex-shrink-0 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden="true"
          />
        </Link>

        {/* Title / location — common to any profile, not just founders */}
        {(user.profile?.title || user.profile?.location) && (
          <div className="space-y-1 border-t border-[var(--border)] pt-3 text-sm text-[var(--text-muted)]">
            {user.profile?.title && (
              <p className="flex items-center gap-1.5">
                <Briefcase size={13} className="flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{user.profile.title}</span>
              </p>
            )}
            {user.profile?.location && (
              <p className="flex items-center gap-1.5">
                <MapPin size={13} className="flex-shrink-0" aria-hidden="true" />
                <span className="truncate">{user.profile.location}</span>
              </p>
            )}
          </div>
        )}

        {/* Bio */}
        {user.profile?.bio && (
          <p className="line-clamp-3 border-t border-[var(--border)] pt-3 text-sm text-[var(--text-muted)]">
            {user.profile.bio}
          </p>
        )}

        {/* Industry tags */}
        {industries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-3">
            {industries.slice(0, 4).map((tag) => (
              <Badge key={tag} className="rounded-md text-[11px]">
                {tag}
              </Badge>
            ))}
            {industries.length > 4 && (
              <span className="self-center text-[11px] text-[var(--text-muted)]">
                +{industries.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Startup info — only relevant for founders */}
        {startupInfo.companyName && (
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-xs font-semibold text-[var(--text-muted)]">Startup</p>
            <p className="text-sm font-semibold text-[var(--text-main)]">
              {startupInfo.companyName}
            </p>
            {startupInfo.stage && (
              <p className="mt-1 text-sm text-[var(--text-muted)]">{startupInfo.stage}</p>
            )}
          </div>
        )}

        {startupInfo.fundingNeeded && (
          <div className="rounded-md border border-[var(--border)] bg-[var(--surface)] p-3">
            <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-muted)]">
              Funding goal
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-main)]">
              {startupInfo.fundingNeeded}
            </p>
          </div>
        )}

        {/* Profile completion — nudges incomplete profiles, hides once done */}
        {completion < 100 ? (
          <div className="border-t border-[var(--border)] pt-3">
            <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--text-muted)]">
              <span>Profile completion</span>
              <span className="font-medium text-[var(--text-main)]">{completion}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface)]">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-all duration-300"
                style={{ width: `${completion}%` }}
              />
            </div>
            <Link
              href={profileHref}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline"
            >
              Complete your profile
              <ArrowUpRight size={11} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 border-t border-[var(--border)] pt-3 text-xs font-medium text-emerald-600">
            <CheckCircle2 size={13} aria-hidden="true" />
            Profile complete
          </div>
        )}

        {/* Quick links */}
        <div className="flex gap-2 border-t border-[var(--border)] pt-3">
          <Link
            href={dashboardHref}
            className="flex-1 rounded-md border border-[var(--border)] px-3 py-1.5 text-center text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--surface)]"
          >
            Dashboard
          </Link>
          <Link
            href={profileHref}
            className="flex-1 rounded-md border border-[var(--border)] px-3 py-1.5 text-center text-xs font-semibold text-[var(--text-main)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--surface)]"
          >
            View profile
          </Link>
        </div>
      </Card>
    </aside>
  );
}