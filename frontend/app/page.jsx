"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, ChartColumnIncreasing, ShieldCheck } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { InvestorCard } from "@/components/investor-card";
import { investors } from "@/data/mock";
import { useUser } from "@/components/providers/UserProvider";
import { BRAND_NAME } from "@/config/branding";

const stats = [
  { label: "Verified founders", value: "4,100+" },
  { label: "Active investors", value: "1,250+" },
  { label: "Capital deployed", value: "$2.8B" },
  { label: "Monthly deal flow", value: "740" },
];

export default function Home() {
  const router = useRouter();
  const { user, loading: checkingAuth, logout } = useUser();

  const handleContinue = () => {
    const role = user?.role;
    if (!role) return router.push("/role");
    if (role === "investor") return router.push("/dashboard/investor");
    if (role === "founder") return router.push("/dashboard/founder");
    router.push("/role");
  };

  const handleSwitchAccount = async () => {
    await logout();
    // After logout, the UserProvider will clear the user state.
    // We stay on this page.
  };

  return (
    <div>
      <PublicNavbar />

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 md:px-6 md:py-24 lg:px-8 md:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3 py-1 text-xs text-[var(--text-muted)]">
            <ShieldCheck size={14} className="text-[var(--accent)]" /> Verified network for trusted funding
          </p>
          <h1 className="mt-5 text-3xl font-semibold leading-tight md:text-4xl lg:text-5xl">
            Connecting Visionary Founders with Smart Investors
          </h1>
          <p className="mt-4 max-w-xl text-sm text-[var(--text-muted)] md:text-base">
            {BRAND_NAME} helps qualified founders get discovered by aligned investors with secure messaging, profile verification, and clear deal workflows.
          </p>
          <div className="mt-6 min-h-[110px]">
            {checkingAuth ? (
              <div className="h-[110px] animate-pulse rounded-2xl border border-[var(--border)] bg-white/60" />
            ) : user ? (
              <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm animate-[fadeIn_300ms_ease-out]">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Continue as
                </p>
                <p className="mt-2 text-base font-semibold text-[var(--text-main)]">
                  {user?.name || user?.email || "Verified user"}
                </p>
                {user?.email && (
                  <p className="text-xs text-[var(--text-muted)]">{user.email}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button size="lg" onClick={handleContinue}>
                    Continue
                  </Button>
                  <Button variant="secondary" size="lg" onClick={handleSwitchAccount}>
                    Switch account
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3 animate-[fadeIn_300ms_ease-out]">
                <Link href="/login">
                  <Button size="lg">
                    Login <ArrowRight size={16} className="ml-1" />
                  </Button>
                </Link>
                <Link href="/signup?role=founder">
                  <Button variant="secondary" size="lg">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
        <Card className="bg-white">
          <CardTitle className="flex items-center gap-2">
            <ChartColumnIncreasing size={18} className="text-[var(--primary)]" /> Deal activity this week
          </CardTitle>
          <CardDescription className="mt-1">Live cross-platform momentum</CardDescription>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-[var(--surface)] p-3">
                <p className="text-xl font-semibold text-[var(--primary)]">{s.value}</p>
                <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section id="how" className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-semibold md:text-3xl">How it works</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["Create verified profile", "Founders and investors complete trust and identity checks."],
            ["Discover and connect", "Match by stage, sector, geography, and check quality signals."],
            ["Manage deals", "Run funding conversations with structured negotiation workflows."],
          ].map(([title, desc], i) => (
            <Card key={title}>
              <p className="text-xs font-semibold text-[var(--secondary)]">Step {i + 1}</p>
              <CardTitle className="mt-2">{title}</CardTitle>
              <CardDescription className="mt-2">{desc}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <section id="featured" className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold md:text-3xl">Featured startups</h2>
          <Link href="/startups" className="text-sm font-medium text-[var(--primary)]">
            Explore all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="col-span-full text-center py-8 text-[var(--text-muted)]">
            Startups coming soon via API...
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-semibold md:text-3xl">Featured investors</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {investors.map((investor) => (
            <InvestorCard key={investor.id} investor={investor} />
          ))}
        </div>
      </section>

      <section id="stats" className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-semibold md:text-3xl">Platform statistics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <p className="text-2xl font-semibold text-[var(--primary)]">{stat.value}</p>
              <CardDescription className="mt-1">{stat.label}</CardDescription>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-10">
        <h2 className="text-2xl font-semibold md:text-3xl">Founder and investor testimonials</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "We closed our seed round in 5 weeks with higher-quality investor conversations.",
            "The verification layer saved us from low-signal inbound and improved speed to conviction.",
            "Deal workflow transparency made negotiation faster and much cleaner for our IC process.",
          ].map((quote) => (
            <Card key={quote}>
              <p className="text-sm text-[var(--text-main)]">&ldquo;{quote}&rdquo;</p>
              <p className="mt-3 inline-flex items-center gap-1 text-xs text-[var(--secondary)]">
                <BadgeCheck size={12} /> Verified user
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 md:px-6 lg:px-8 py-12">
        <Card className="bg-[var(--primary)] text-white">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="text-2xl font-semibold">Ready to raise or invest with confidence?</h3>
              <p className="mt-2 text-sm text-blue-100">Join a trusted ecosystem built for real startup funding execution.</p>
            </div>
            <div className="flex gap-3">
              <Link href="/signup?role=founder">
                <Button variant="success">Join as Founder</Button>
              </Link>
              <Link href="/signup?role=investor">
                <Button variant="outline">Join as Investor</Button>
              </Link>
            </div>
          </div>
        </Card>
      </section>

      <Footer />
    </div>
  );
}
