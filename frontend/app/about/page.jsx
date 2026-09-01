"use client";

import { ShieldCheck, Target, Users } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { BRAND_NAME } from "@/config/branding";

const STATS = [
  { label: "Verified founders", value: "4,100+" },
  { label: "Active investors", value: "1,250+" },
  { label: "Capital deployed", value: "$2.8B" },
  { label: "Monthly deal flow", value: "740" },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Trust first",
    desc: "Every founder and investor on the platform goes through verification, so conversations start with real signal, not noise.",
  },
  {
    icon: Target,
    title: "Built for outcomes",
    desc: "We're not a social network. Every feature exists to move a deal from first contact to close, as efficiently as possible.",
  },
  {
    icon: Users,
    title: "Two-sided by design",
    desc: "Founders and investors see the same deal room, the same status, and the same activity log - no information asymmetry.",
  },
];

export default function AboutPage() {
  return (
    <div>
      <PublicNavbar />

      <section className="mx-auto w-full max-w-5xl px-4 py-16 text-center md:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Our mission: make fundraising a straight line, not a maze
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-muted)]">
          {BRAND_NAME} connects founders with investors who are actually looking for their sector,
          stage, and geography - and gives both sides the tools to close a deal without leaving the platform.
        </p>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((s) => (
            <Card key={s.label} className="text-center">
              <p className="text-2xl font-semibold text-[var(--primary)]">{s.value}</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{s.label}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold tracking-tight">What we believe</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {VALUES.map((v) => (
            <Card key={v.title}>
              <v.icon size={22} className="text-[var(--primary)]" />
              <CardTitle className="mt-3">{v.title}</CardTitle>
              <CardDescription className="mt-1">{v.desc}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-6 lg:px-8">
        <Card>
          <CardTitle>Where we operate</CardTitle>
          <CardDescription className="mt-2">
            {BRAND_NAME} currently supports founders and investors across North America, Europe, and the
            GCC region, with new markets added based on demand from our community.
          </CardDescription>
        </Card>
      </section>

      <Footer />
    </div>
  );
}