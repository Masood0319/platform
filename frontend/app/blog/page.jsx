"use client";

import { Calendar } from "lucide-react";
import { PublicNavbar } from "@/components/layout/public-navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// NOTE: There's no blog/CMS backend yet - these are placeholder posts so the
// page has real structure and content to design against. Wire this up to a
// real posts API (and an admin editor) when that's ready.
const POSTS = [
  {
    slug: "pitch-deck-essentials",
    title: "10 slides every fundraising pitch deck needs",
    excerpt: "A breakdown of the exact structure investors expect to see - and the three slides most founders get wrong.",
    tag: "Pitch decks",
    date: "2026-06-02",
  },
  {
    slug: "reading-a-term-sheet",
    title: "How to read a term sheet without a lawyer on speed dial",
    excerpt: "The five terms that matter most for early-stage founders, explained in plain English.",
    tag: "Fundraising",
    date: "2026-05-18",
  },
  {
    slug: "investor-outreach-that-works",
    title: "Why cold investor outreach rarely works (and what to do instead)",
    excerpt: "Warm intros beat cold emails every time - here's how to build the kind of profile that gets found.",
    tag: "Investor relations",
    date: "2026-04-27",
  },
  {
    slug: "seed-market-trends",
    title: "What we're seeing in seed-stage valuations this year",
    excerpt: "A look at how check sizes and valuations have shifted across our platform's deal flow.",
    tag: "Market trends",
    date: "2026-03-11",
  },
];

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

export default function BlogPage() {
  return (
    <div>
      <PublicNavbar />

      <section className="mx-auto w-full max-w-5xl px-4 py-16 text-center md:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Resources</h1>
        <p className="mx-auto mt-4 max-w-2xl text-[var(--text-muted)]">
          Fundraising guides, pitch deck tips, and market trends for founders and investors.
        </p>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-16 md:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {POSTS.map((post) => (
            <Card key={post.slug} className="flex h-full flex-col">
              <Badge variant="outline" className="w-fit">{post.tag}</Badge>
              <CardTitle className="mt-3">{post.title}</CardTitle>
              <CardDescription className="mt-2 flex-1">{post.excerpt}</CardDescription>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <Calendar size={13} />
                {formatDate(post.date)}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}