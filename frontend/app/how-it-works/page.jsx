"use client";

import { useState } from "react";
import { UserPlus, Search, Handshake, ChevronDown } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const FOUNDER_STEPS = [
  { title: "Create your profile", desc: "Add your startup details, pitch deck, traction metrics, and what you're raising." },
  { title: "Get discovered", desc: "Investors searching by sector, stage, and country find your profile and express interest." },
  { title: "Match & connect", desc: "When you're both interested, a deal room opens automatically - no cold outreach needed." },
  { title: "Close the deal", desc: "Share documents, track status from NDA through due diligence, and close - all in one place." },
];

const INVESTOR_STEPS = [
  { title: "Set your thesis", desc: "Tell us your check size, sectors, and countries of interest so we can surface the right startups." },
  { title: "Search & filter", desc: "Browse verified founders by stage, traction, and how much they're raising." },
  { title: "Express interest", desc: "One click, no spam - founders only see interest when it's mutual." },
  { title: "Manage your deal flow", desc: "Every active deal lives in its own room with a shared status tracker and document vault." },
];

const FAQS = [
  {
    q: "Is my information visible to everyone?",
    a: "No. Full contact details are only shared once both sides mutually express interest and a deal room opens - or after 5 messages are exchanged in chat.",
  },
  {
    q: "How does verification work?",
    a: "Founders upload a registration certificate and investors upload accreditation proof. Once approved, a verification badge appears on the profile.",
  },
  {
    q: "What happens when a deal closes?",
    a: "Both parties confirm the closed amount in the deal room, and a success fee (see Pricing) is calculated automatically.",
  },
  {
    q: "Can I use the platform for free?",
    a: "Yes - creating a profile, searching, and messaging are free. Fees only apply when a deal successfully closes.",
  },
];

function StepList({ steps }) {
  return (
    <ol className="space-y-4">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-4">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
            {i + 1}
          </span>
          <div>
            <p className="font-semibold text-[var(--text-main)]">{step.title}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{step.desc}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[var(--border)] py-4">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-medium text-[var(--text-main)]">{q}</span>
        <ChevronDown size={18} className={cn("flex-shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && <p className="mt-2 text-sm text-[var(--text-muted)]">{a}</p>}
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <div>
      <PublicNavbar />

      <section className="mx-auto w-full max-w-5xl px-4 py-16 text-center md:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">How it works</h1>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-muted)]">
          Whether you're raising or investing, here's the path from sign-up to a closed deal.
        </p>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <UserPlus size={20} className="text-[var(--primary)]" />
              <CardTitle>For Founders</CardTitle>
            </div>
            <StepList steps={FOUNDER_STEPS} />
          </Card>
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <Search size={20} className="text-[var(--primary)]" />
              <CardTitle>For Investors</CardTitle>
            </div>
            <StepList steps={INVESTOR_STEPS} />
          </Card>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 pb-16 md:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2">
          <Handshake size={20} className="text-[var(--primary)]" />
          <h2 className="text-2xl font-semibold tracking-tight">Frequently asked questions</h2>
        </div>
        <Card className="p-0">
          <div className="px-5">
            {FAQS.map((f) => (
              <FaqItem key={f.q} {...f} />
            ))}
          </div>
        </Card>
      </section>

      <Footer />
    </div>
  );
}