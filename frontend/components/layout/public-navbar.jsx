"use client";

import Link from "next/link";
import { BRAND_NAME } from "@/config/branding";
import { Bell } from "lucide-react";
import { notifications } from "@/data/mock";
import { Button } from "@/components/ui/button";
import { NotificationItem } from "@/components/notification-item";

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 md:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-[var(--primary)]">
          {BRAND_NAME}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[var(--text-muted)] md:flex">
          <a href="#how">How it works</a>
          <a href="#featured">Featured</a>
          <a href="#stats">Stats</a>
        </nav>
        <div className="flex items-center gap-2">
          <details className="group relative">
            <summary className="list-none cursor-pointer rounded-lg p-2 hover:bg-[var(--surface)]">
              <Bell size={18} />
            </summary>
            <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-3 shadow-xl sm:max-w-80">
              {notifications.map((n) => (
                <NotificationItem key={n.id} title={n.title} subtitle={n.subtitle} time={n.time} />
              ))}
            </div>
          </details>
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Sign up</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
