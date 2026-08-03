"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Bell,
  Menu,
  X,
  LayoutDashboard,
  UserRound,
  Settings,
  Search,
  Building2,
  TrendingUp,
  Sparkles,
  Users,
  CornerDownLeft,
  Home,
  Handshake,
  Briefcase
} from "lucide-react";

import { NotificationItem } from "@/components/notification-item";
import { LeftSidebar } from "@/components/layout/left-sidebar";
import { LogoutButton } from "@/components/auth/logout-button";
import { BRAND_NAME } from "@/config/branding";
import { getNotifications } from "@/lib/services/notificationService";
import { useUser } from "@/components/providers/UserProvider";
import { AuthGuard } from "@/components/auth/AuthGuard";

/* ============================================================================
 * NAV CONFIG
 * Single source of truth for primary navigation, role-aware routing, and
 * active-link matching.
 * ========================================================================== */

const PRIMARY_NAV = [
  {
    href: "/home",
    label: "Home",
    icon: Home,
    visible: (role) => !!role,
  },
  {
    href: "/discover",
    label: "Discover",
    icon: Search,
  },
  {
    href: "/startups",
    label: "My Startups",
    icon: Building2,
    visible: (role) => role === "founder",
  },
  {
    href: "/matches",
    label: "Matches",
    icon: Sparkles,
  },
  {
    href: "/dealrooms",
    label: "Deal Rooms",
    icon: Handshake,
    visible: (role) => role === "founder" || role === "investor",
  }
];


const NOTIFICATIONS_HREF = "/notifications";
const MAX_DROPDOWN_NOTIFICATIONS = 6;

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

function getDashboardHref(role) {
  return DASHBOARD_BY_ROLE[role] || DASHBOARD_BY_ROLE.founder;
}

function getProfileHref(role) {
  return PROFILE_BY_ROLE[role] || PROFILE_BY_ROLE.founder;
}

function isNavItemActive(pathname, href) {
  return pathname === href || pathname?.startsWith(`${href}/`);
}

const SEARCH_SCOPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "startups", label: "Startups", icon: Building2 },
  { value: "investors", label: "Investors", icon: TrendingUp },
  { value: "founders", label: "Founders", icon: Users },
  { value: "advisors", label: "Advisors", icon: Briefcase },
];

/* ============================================================================
 * useDropdown — shared open/outside-click/Escape behavior
 * ========================================================================== */

function useDropdown() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    }
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        close();
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, close]);

  return { open, toggle, close, containerRef, triggerRef };
}

/* ============================================================================
 * TabLink
 * ========================================================================== */

function TabLink({ href, label, icon: Icon, active, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`relative flex items-center gap-2 whitespace-nowrap py-2.5 text-sm font-medium transition-colors ${
        active
          ? "text-[var(--text-main)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-main)]"
      }`}
    >
      <Icon size={15} className="shrink-0" aria-hidden="true" />
      <span>{label}</span>
      {active && (
        <span
          className="absolute inset-x-0 -bottom-[10.5px] h-[2px] rounded-full bg-[var(--primary)]"
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

function MobileNavRow({ href, label, icon: Icon, active, onClick, badge }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 border-l-2 px-3 py-3 text-sm font-medium transition-colors ${
        active
          ? "border-[var(--primary)] bg-[var(--surface)] text-[var(--text-main)]"
          : "border-transparent text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-main)]"
      }`}
    >
      <Icon size={16} aria-hidden="true" />
      <span>{label}</span>
      {badge != null && badge > 0 && (
        <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-semibold text-white">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}

/* ============================================================================
 * CommandPalette
 * ========================================================================== */

function CommandPalette({ open, onClose, onSearch }) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setScope("all");
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch({ query, scope });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/40 px-4 pt-20 sm:pt-28"
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target)) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border)] bg-white shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
          <Search size={16} className="flex-shrink-0 text-[var(--text-muted)]" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search startups, investors, founders, advisors..."
            className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <kbd className="hidden flex-shrink-0 rounded border border-[var(--border)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-muted)] sm:block">
            ESC
          </kbd>
        </form>

        <div className="flex flex-wrap gap-1.5 border-b border-[var(--border)] p-3">
          {SEARCH_SCOPE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScope(opt.value)}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  scope === opt.value
                    ? "bg-slate-950 text-white"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {Icon && <Icon size={11} aria-hidden="true" />}
                {opt.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!query.trim()}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-[var(--text-muted)] transition hover:bg-[var(--surface)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>
            {query.trim() ? (
              <>
                Search for <span className="font-medium text-[var(--text-main)]">"{query}"</span>
              </>
            ) : (
              "Start typing to search"
            )}
          </span>
          <CornerDownLeft size={13} className="flex-shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
 * MobileDrawer
 * ========================================================================== */

function MobileDrawer({ open, onClose, children, triggerRef }) {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    closeButtonRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef?.current?.focus();
    };
  }, [open, onClose, triggerRef]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/30 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`${BRAND_NAME} navigation menu`}
        id="mobile-navigation"
        className="fixed inset-y-0 right-0 z-50 flex w-[85%] max-w-xs flex-col bg-white shadow-2xl md:hidden"
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-4">
          <span className="text-sm font-semibold text-[var(--text-main)]">{BRAND_NAME}</span>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--surface)]"
            aria-label="Close menu"
            type="button"
          >
            <X size={18} />
          </button>
        </div>
        <nav aria-label="Mobile navigation" className="flex-1 space-y-1 overflow-y-auto py-2">
          {children}
        </nav>
      </div>
    </>
  );
}

/* ============================================================================
 * AppShell
 * ========================================================================== */

export function AppShell({ children, title, subtitle, actions }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const drawerTriggerRef = useRef(null);
  const notifDropdown = useDropdown();
  const profileDropdown = useDropdown();

  const dashboardHref = getDashboardHref(user?.role);
  const profileHref = getProfileHref(user?.role);

  // --- Notifications: initial load ---
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    async function loadNotifications() {
      try {
        const data = await getNotifications();
        const items = data.notifications || [];
        if (cancelled) return;
        setNotifications(items.slice(0, MAX_DROPDOWN_NOTIFICATIONS));
        setUnreadCount(items.filter((n) => !n.isRead).length);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    }
    loadNotifications();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // --- Notifications: live updates ---
  useEffect(() => {
    const handleNewNotification = (event) => {
      const { notification } = event.detail;
      setNotifications((prev) => [notification, ...prev].slice(0, MAX_DROPDOWN_NOTIFICATIONS));
      setUnreadCount((prev) => prev + 1);
    };
    window.addEventListener("notification:new", handleNewNotification);
    return () => window.removeEventListener("notification:new", handleNewNotification);
  }, []);

  useEffect(() => {
    const handleRead = () => setUnreadCount(0);
    window.addEventListener("messages:read", handleRead);
    return () => window.removeEventListener("messages:read", handleRead);
  }, []);

  // --- Close drawer/dropdowns/palette on route change ---
  useEffect(() => {
    setDrawerOpen(false);
    setPaletteOpen(false);
    notifDropdown.close();
    profileDropdown.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // --- Global ⌘K / Ctrl+K shortcut to open search ---
  useEffect(() => {
    function handleGlobalKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // BACKEND: No /search page exists yet. Redirect to /discover with scope params.
  // TODO: Create /search page or remove this redirect once discover handles this.
  const handleSearch = ({ query, scope }) => {
    if (!query.trim()) return;
    // Redirect to discover page which has built-in search/filter capabilities
    router.push(`/discover?q=${encodeURIComponent(query)}&scope=${scope}`);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen overflow-x-hidden bg-[var(--bg)]">
        {/* Skip link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>

      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-white">
        {/* Single row */}
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 md:px-6 lg:px-8">
          <Link href="/" className="flex-shrink-0 text-base font-semibold tracking-tight text-[var(--text-main)]">
            {BRAND_NAME}
          </Link>

          {/* Search bar */}
          <div className="hidden flex-1 md:flex md:justify-center">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-sm text-[var(--text-muted)] transition hover:border-[var(--primary)]/40 hover:bg-white w-80"
            >
              <Search size={15} className="flex-shrink-0" aria-hidden="true" />
              <span className="flex-1 truncate">Search startups, investors, founders, advisors...</span>
              <kbd className="hidden flex-shrink-0 rounded border border-[var(--border)] bg-white px-1.5 py-0.5 text-[10px] font-medium sm:block">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Underline tabs */}
          <nav
            aria-label="Primary navigation"
            className="hidden items-center gap-6 overflow-x-auto lg:flex"
          >
            {PRIMARY_NAV.filter((item) => (item.visible ? item.visible(user?.role) : true)).map((item) => (
              <TabLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={isNavItemActive(pathname, item.href)}
              />
            ))}
          </nav>

          <div className="ml-auto flex flex-shrink-0 items-center gap-2">
            {/* Notifications */}
            <div className="relative" ref={notifDropdown.containerRef}>
              <button
                ref={notifDropdown.triggerRef}
                onClick={notifDropdown.toggle}
                className="relative rounded-md p-2 text-[var(--text-muted)] transition hover:bg-[var(--surface)] hover:text-[var(--text-main)]"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
                aria-expanded={notifDropdown.open}
                aria-haspopup="true"
                type="button"
              >
                <Bell size={18} aria-hidden="true" />
                {unreadCount > 0 && (
                  <span
                    className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-semibold text-white"
                    aria-hidden="true"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {notifDropdown.open && (
                <div
                  role="menu"
                  aria-label="Notifications"
                  className="absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-[var(--border)] bg-white shadow-xl"
                >
                  <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--text-main)]">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="text-xs font-medium text-[var(--primary)]">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>

                  <div className="max-h-80 space-y-1 overflow-y-auto p-2">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <NotificationItem
                          key={n.id || n._id}
                          title={n.title}
                          subtitle={n.description || n.subtitle}
                          time={n.time}
                        />
                      ))
                    ) : (
                      <p className="p-6 text-center text-sm text-[var(--text-muted)]">
                        You're all caught up — no notifications yet.
                      </p>
                    )}
                  </div>

                  <Link
                    href={NOTIFICATIONS_HREF}
                    onClick={notifDropdown.close}
                    className="block border-t border-[var(--border)] px-4 py-3 text-center text-sm font-medium text-[var(--primary)] hover:bg-slate-50"
                  >
                    View all notifications
                  </Link>
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative hidden md:block" ref={profileDropdown.containerRef}>
              <button
                ref={profileDropdown.triggerRef}
                onClick={profileDropdown.toggle}
                className="flex items-center gap-1.5 rounded-md p-1.5 text-[var(--text-muted)] transition hover:bg-[var(--surface)]"
                aria-label="Open profile menu"
                aria-expanded={profileDropdown.open}
                aria-haspopup="true"
                type="button"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                  {(user?.name || "U").charAt(0).toUpperCase()}
                </span>
              </button>
              {profileDropdown.open && (
                <div
                  role="menu"
                  aria-label="Profile menu"
                  className="absolute right-0 top-full mt-2 w-52 space-y-1 rounded-lg border border-[var(--border)] bg-white p-2 shadow-xl"
                >
                  <Link
                    href={profileHref}
                    onClick={profileDropdown.close}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-main)]"
                    role="menuitem"
                  >
                    <UserRound size={15} aria-hidden="true" />
                    Profile
                  </Link>
                  <Link
                    href={dashboardHref}
                    onClick={profileDropdown.close}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-main)]"
                    role="menuitem"
                  >
                    <LayoutDashboard size={15} aria-hidden="true" />
                    Dashboard
                  </Link>
                  {/* TODO: Enable /settings when the Settings page is implemented on the backend */}
                  {false && (
                    <Link
                      href="/settings"
                      onClick={profileDropdown.close}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-main)]"
                      role="menuitem"
                    >
                      <Settings size={15} aria-hidden="true" />
                      Settings
                    </Link>
                  )}
                  <div className="my-1 border-t border-[var(--border)]" />
                  <LogoutButton variant="ghost" size="sm" fullWidth className="justify-start" />
                </div>
              )}
            </div>

            <div className="hidden md:block">
              <LogoutButton variant="outline" size="sm" />
            </div>

            {/* Mobile menu button */}
            <button
              ref={drawerTriggerRef}
              className="rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--surface)] md:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={drawerOpen}
              aria-controls="mobile-navigation"
              type="button"
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mobile search bar */}
        <div className="mx-auto w-full max-w-7xl border-b border-[var(--border)] px-4 py-3 md:hidden md:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="flex w-full items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-left text-sm text-[var(--text-muted)] transition hover:border-[var(--primary)]/40 hover:bg-white"
          >
            <Search size={15} className="flex-shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">Search startups, investors, founders, advisors...</span>
            <kbd className="hidden flex-shrink-0 rounded border border-[var(--border)] bg-white px-1.5 py-0.5 text-[10px] font-medium sm:block">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Mobile Drawer */}
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} triggerRef={drawerTriggerRef}>
          {PRIMARY_NAV.filter((item) => (item.visible ? item.visible(user?.role) : true)).map((item) => (
            <MobileNavRow
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isNavItemActive(pathname, item.href)}
              onClick={() => setDrawerOpen(false)}
            />
          ))}

          <div className="my-2 border-t border-[var(--border)]" />

          <MobileNavRow
            href={NOTIFICATIONS_HREF}
            label="Notifications"
            icon={Bell}
            active={isNavItemActive(pathname, NOTIFICATIONS_HREF)}
            onClick={() => setDrawerOpen(false)}
            badge={unreadCount}
          />
          <MobileNavRow
            href={dashboardHref}
            label="Dashboard"
            icon={LayoutDashboard}
            active={isNavItemActive(pathname, dashboardHref)}
            onClick={() => setDrawerOpen(false)}
          />
          <MobileNavRow
            href={profileHref}
            label="Profile"
            icon={UserRound}
            active={isNavItemActive(pathname, profileHref)}
            onClick={() => setDrawerOpen(false)}
          />
          {/* TODO: Enable /settings when the Settings page is implemented */}
          {false && (
            <MobileNavRow
              href="/settings"
              label="Settings"
              icon={Settings}
              active={isNavItemActive(pathname, "/settings")}
              onClick={() => setDrawerOpen(false)}
            />
          )}

          <div className="px-3 pt-3">
            <LogoutButton variant="outline" size="sm" fullWidth />
          </div>
        </MobileDrawer>
      </header>
      </div>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onSearch={handleSearch}
      />

      {/* Page Content */}
      <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 px-4 py-6 md:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <div className="hidden lg:block">
          <LeftSidebar />
        </div>

        <main id="main-content" className="min-w-0">
          <div className="mb-4 flex flex-col gap-2 border-b border-[var(--border)] pb-4 md:mb-6 md:flex-row md:items-end md:justify-between md:pb-6">
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-[var(--text-main)] md:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1.5 text-sm text-[var(--text-muted)]">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex flex-shrink-0 flex-wrap gap-2">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}