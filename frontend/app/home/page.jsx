"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ArrowRight, Building2, Sparkles, Users } from "lucide-react";

export default function HomePage() {
  return (
    <AppShell title="Home" subtitle="Discover startups and connect with investors">
      <div className="space-y-6">
        <Card className="overflow-hidden border-[var(--border)] bg-gradient-to-r from-[var(--primary)]/10 to-[var(--secondary)]/10">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                  Fundraising platform
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text-main)]">
                  Find the right startup opportunities and investor conversations.
                </h2>
                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  Streamline discovery, express interest, and move into structured deal rooms without a social stream.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/startups">
                  <Button className="gap-2">
                    <Building2 size={16} /> Browse startups
                  </Button>
                </Link>
                <Link href="/matches">
                  <Button variant="outline" className="gap-2">
                    <Sparkles size={16} /> View matches
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardTitle className="flex items-center gap-2">
              <Building2 size={16} className="text-[var(--primary)]" />
              Startup discovery
            </CardTitle>
            <CardDescription className="mt-2">
              Browse curated fundraising profiles and evaluate opportunities quickly.
            </CardDescription>
          </Card>
          <Card>
            <CardTitle className="flex items-center gap-2">
              <Users size={16} className="text-[var(--primary)]" />
              Investor matching
            </CardTitle>
            <CardDescription className="mt-2">
              Express interest and move into a structured conversation when there is mutual fit.
            </CardDescription>
          </Card>
          <Card>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight size={16} className="text-[var(--primary)]" />
              Deal rooms
            </CardTitle>
            <CardDescription className="mt-2">
              Continue investment conversations in secure deal rooms with an activity timeline.
            </CardDescription>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
