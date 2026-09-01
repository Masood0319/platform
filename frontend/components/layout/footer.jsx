import Link from "next/link";
import { Linkedin, Twitter } from "lucide-react";
import { BRAND_NAME } from "@/config/branding";

const LINK_COLUMNS = [
  {
    heading: "Platform",
    links: [
      { label: "Discover", href: "/discover" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 text-sm text-[var(--text-muted)] sm:grid-cols-2 md:grid-cols-4 md:px-6 lg:px-8">
        <div className="sm:col-span-2 md:col-span-2">
          <Link href="/" className="font-semibold text-[var(--primary)]">
            {BRAND_NAME}
          </Link>
          <p className="mt-2 max-w-xs">
            Trusted funding network for verified founders and serious investors.
          </p>
          <div className="mt-4 flex gap-3">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="Twitter"
              className="rounded-lg p-2 hover:bg-[var(--surface)] hover:text-[var(--text-main)]"
            >
              <Twitter size={16} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="LinkedIn"
              className="rounded-lg p-2 hover:bg-[var(--surface)] hover:text-[var(--text-main)]"
            >
              <Linkedin size={16} />
            </a>
          </div>
        </div>

        {LINK_COLUMNS.map((col) => (
          <div key={col.heading}>
            <p className="font-semibold text-[var(--text-main)]">{col.heading}</p>
            <div className="mt-2 space-y-1.5">
              {col.links.map((link) => (
                <Link key={link.href} href={link.href} className="block hover:text-[var(--text-main)]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[var(--border)]">
        <p className="mx-auto w-full max-w-7xl px-4 py-4 text-xs text-[var(--text-muted)] md:px-6 lg:px-8">
          © {year} {BRAND_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}