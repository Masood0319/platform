"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Download, FileUp, MapPin, Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { getStartupById } from "@/lib/services/startupService";
import Link from "next/link";

export default function StartupProfilePage() {
  const params = useParams();
  const slug = params?.slug;
  const [startup, setStartup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Normalize backend startup shape to frontend-expected fields
  const normalizeStartup = (raw) => {
    if (!raw) return null;
    return {
      ...raw,
      id: raw._id || raw.id,
      name: raw.name || raw.startupName || '',
      industry: raw.industry || raw.industries || (raw.sector ? [raw.sector] : []),
      industryTags: raw.industryTags || raw.industries || (raw.sector ? [raw.sector] : []),
      location: raw.location || raw.city || raw.registrationCountry || '—',
      fundingTarget: raw.fundingTarget || raw.target || 0,
      fundingRaised: raw.fundingRaised || raw.raised || 0,
    };
  };

  useEffect(() => {
    async function fetchStartup() {
      if (!slug) {
        setError("No slug provided");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await getStartupById(slug);
        if (!data) {
          setError("Startup not found");
        } else {
          setStartup(normalizeStartup(data));
        }
      } catch (err) {
        setError("Failed to load startup");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStartup();
  }, [slug]);

  if (loading) {
    return (
      <AppShell title="Loading..." >
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]" />
        </div>
      </AppShell>
    );
  }

  if (error || !startup) {
    return (
      <AppShell title="Startup Not Found">
        <div className="max-w-md mx-auto mt-20 text-center">
          <h1 className="text-2xl font-bold mb-4">{error || "Startup not found"}</h1>
          <Link href="/startups">
            <Button>Back to Startups</Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Startup Profile"
      subtitle="Showcase traction, funding needs, and investor interest."
    >
      <Card className="overflow-hidden p-0">
        <div className="h-36 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)]" />
        <div className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-2xl">{startup.name}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-[var(--text-muted)]">
            <span>Industry: {startup.industryTags?.join(', ') || startup.industry?.join(', ') || 'N/A'}</span>
            <span>Funding stage: {startup.stage}</span>
            <span>Funding required: ${startup.fundingTarget?.toLocaleString()}</span>
            <span>Raised: ${startup.fundingRaised?.toLocaleString()}</span>
            <span className="inline-flex items-center gap-1"><MapPin size={14} /> {startup.location}</span>
          </div>
            <p className="text-sm text-[var(--text-muted)] mb-2">{startup.tagline}</p>
            <p className="max-w-3xl text-sm text-[var(--text-main)]">{startup.description}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm"><FileUp size={14} className="mr-1" /> Upload pitch deck</Button>
            <Button size="sm" variant="outline"><Download size={14} className="mr-1" /> Download pitch deck</Button>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardTitle className="flex items-center gap-2"><Users size={16} /> Team members</CardTitle>
          <CardDescription className="mt-2">Ava (CEO), Miguel (CTO), Priya (COO), Nate (Growth)</CardDescription>
        </Card>
        <Card>
          <CardTitle>Interested investors</CardTitle>
          <CardDescription className="mt-2">9 investors shortlisted, 4 in active diligence.</CardDescription>
        </Card>
      </div>
    </AppShell>
  );
}
