"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/deals", label: "Deals" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/payouts", label: "Payouts" },
  { href: "/admin/messages", label: "Messages" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
      {ADMIN_LINKS.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname?.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              active
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-main)]"
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}