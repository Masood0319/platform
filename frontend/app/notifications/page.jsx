"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { NotificationFilters } from "@/components/notifications/NotificationFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { useMinimumDelay } from "@/lib/useMinimumDelay";
import {
  getNotifications,
  markNotificationsAsRead,
  deleteNotifications,
} from "@/lib/services/notificationService";
import { Search, X, Trash2, CheckCheck, Bell, ArrowUpDown, Undo2, CheckSquare } from "lucide-react";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "unread", label: "Unread first" },
];

function matchesFilter(notification, activeFilter) {
  if (activeFilter === "all") return true;
  if (activeFilter === "unread") return !notification.isRead;
  return notification.type === activeFilter;
}

function matchesSearch(notification, query) {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    notification.title?.toLowerCase().includes(q) ||
    notification.description?.toLowerCase().includes(q)
  );
}

// Buckets notifications into relative time groups based on their "time" label.
// Falls back gracefully if the label doesn't match a known pattern.
function getTimeGroup(notification) {
  const t = (notification.time || "").toLowerCase();
  if (t.includes("minute") || t.includes("hour")) return "Today";
  if (t.includes("yesterday")) return "Yesterday";
  return "Earlier";
}

function groupByTime(notifications) {
  const order = ["Today", "Yesterday", "Earlier"];
  const groups = { Today: [], Yesterday: [], Earlier: [] };
  for (const n of notifications) {
    groups[getTimeGroup(n)].push(n);
  }
  return order
    .map((label) => ({ label, items: groups[label] }))
    .filter((g) => g.items.length > 0);
}

function sortNotifications(list, sortBy) {
  if (sortBy === "oldest") return [...list].reverse();
  if (sortBy === "unread") {
    return [...list].sort((a, b) => (a.isRead ? 1 : 0) - (b.isRead ? 1 : 0));
  }
  return list; // "newest" — trust existing array order (API returns newest-first)
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in" aria-busy="true" aria-live="polite">
      <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <Skeleton className="h-4 w-3/4" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-10 w-36 rounded-full" />
          <Skeleton className="h-10 w-40 rounded-full" />
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
      </div>

      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-[var(--border)] bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad] = useMinimumDelay({ delay: 650 });

  // --- UI state ---
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  // Undo buffer: holds the most recently deleted batch so it can be restored
  // locally if the person changes their mind within a few seconds.
  const [undoBuffer, setUndoBuffer] = useState(null);
  const undoTimerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await getNotifications();
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    const handleNewNotification = (event) => {
      const { notification } = event.detail;
      setNotifications((prev) => [notification, ...prev]);
    };

    window.addEventListener("notification:new", handleNewNotification);
    return () => window.removeEventListener("notification:new", handleNewNotification);
  }, []);

  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  useEffect(() => {
    return () => clearTimeout(undoTimerRef.current);
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const filteredNotifications = useMemo(
    () =>
      sortNotifications(
        notifications.filter(
          (notification) =>
            matchesFilter(notification, activeFilter) &&
            matchesSearch(notification, searchQuery)
        ),
        sortBy
      ),
    [notifications, activeFilter, searchQuery, sortBy]
  );

  const groupedNotifications = useMemo(
    () => groupByTime(filteredNotifications),
    [filteredNotifications]
  );

  const allVisibleSelected =
    filteredNotifications.length > 0 &&
    filteredNotifications.every((n) => selectedIds.has(n._id));

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n._id);
    if (unreadIds.length === 0) return;

    setIsMarkingAllRead(true);
    try {
      await markNotificationsAsRead(unreadIds);
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true, readAt: new Date() }))
      );
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  const offerUndo = (removedItems) => {
    if (!removedItems || removedItems.length === 0) return;
    clearTimeout(undoTimerRef.current);
    setUndoBuffer(removedItems);
    undoTimerRef.current = setTimeout(() => setUndoBuffer(null), 6000);
  };

  const handleClearAll = async () => {
    if (!confirmClearAll) {
      setConfirmClearAll(true);
      return;
    }
    const removed = notifications;
    const allIds = notifications.map((n) => n._id);
    setIsClearingAll(true);
    try {
      await deleteNotifications(allIds);
      setNotifications([]);
      setSelectedIds(new Set());
      setSelectMode(false);
      offerUndo(removed);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    } finally {
      setIsClearingAll(false);
      setConfirmClearAll(false);
    }
  };

  const handleClearSelected = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    const removed = notifications.filter((n) => selectedIds.has(n._id));
    try {
      await deleteNotifications(ids);
      setNotifications((prev) => prev.filter((n) => !selectedIds.has(n._id)));
      setSelectedIds(new Set());
      setSelectMode(false);
      offerUndo(removed);
    } catch (error) {
      console.error("Failed to delete selected notifications:", error);
    }
  };

  const handleUndo = () => {
    if (!undoBuffer) return;
    setNotifications((prev) => [...undoBuffer, ...prev]);
    setUndoBuffer(null);
    clearTimeout(undoTimerRef.current);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        filteredNotifications.forEach((n) => next.delete(n._id));
        return next;
      }
      const next = new Set(prev);
      filteredNotifications.forEach((n) => next.add(n._id));
      return next;
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setShowSearch(false);
  };

  if (isLoading || isInitialLoad) {
    return (
      <AppShell title="Notifications">
        <NotificationsSkeleton />
      </AppShell>
    );
  }

  return (
    <AppShell title="Notifications">
      <section className="space-y-4 sm:space-y-6">
        {/* Header / actions */}
        <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <div className="hidden h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--surface)] sm:flex">
              <Bell size={18} className="text-[var(--text-muted)]" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-muted)]">
                Stay updated with activity related to your startups, investments, and matches.
              </p>
              {unreadCount > 0 && (
                <p className="mt-1 text-xs font-semibold text-[var(--primary)]">
                  {unreadCount} unread
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search toggle */}
            {showSearch ? (
              <div className="relative flex-1 min-w-[160px] sm:flex-none sm:w-52">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Escape" && clearSearch()}
                  placeholder="Search notifications..."
                  className="min-h-[44px] w-full rounded-full border border-[var(--border)] bg-[var(--surface)] py-2 pl-9 pr-9 text-sm outline-none focus:border-[var(--primary)]/40"
                />
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--text-muted)] hover:bg-slate-200/60"
                  aria-label="Close search"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowSearch(true)}
                className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:border-[var(--primary)]/40 hover:bg-white sm:px-4"
              >
                <Search size={14} />
                <span className="hidden sm:inline">Search</span>
              </button>
            )}

            {/* Sort */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort notifications"
                className="min-h-[44px] appearance-none rounded-full border border-[var(--border)] bg-[var(--surface)] py-2 pl-8 pr-3 text-sm font-medium text-[var(--text-main)] outline-none transition hover:border-[var(--primary)]/40 sm:pr-8"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ArrowUpDown
                size={13}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              />
            </div>

            {/* Select mode toggle */}
            <button
              type="button"
              onClick={() => {
                setSelectMode((v) => !v);
                if (selectMode) setSelectedIds(new Set());
              }}
              className={`flex min-h-[44px] items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                selectMode
                  ? "border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-main)] hover:border-[var(--primary)]/40 hover:bg-white"
              }`}
            >
              <CheckSquare size={14} />
              <span className="hidden sm:inline">{selectMode ? "Cancel" : "Select"}</span>
            </button>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || isMarkingAllRead}
              className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:border-[var(--primary)]/40 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
            >
              <CheckCheck size={14} />
              <span className="hidden sm:inline">
                {isMarkingAllRead ? "Marking..." : "Mark all as read"}
              </span>
            </button>

            {confirmClearAll ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={isClearingAll}
                  className="min-h-[44px] rounded-full border border-transparent bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
                >
                  {isClearingAll ? "Clearing..." : "Confirm clear"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="min-h-[44px] rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:bg-[var(--surface)]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={notifications.length === 0}
                className="flex min-h-[44px] items-center gap-1.5 rounded-full border border-transparent bg-[var(--primary)] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Clear notifications</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-[var(--border)] bg-white p-3 shadow-sm sm:p-4">
          <div className="overflow-x-auto">
            <NotificationFilters activeFilter={activeFilter} onChange={setActiveFilter} />
          </div>
        </div>

        {/* Bulk selection bar */}
        {selectMode && (
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--primary)]/30 bg-[var(--primary)]/5 p-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-main)]">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                className="h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]"
              />
              {selectedIds.size > 0
                ? `${selectedIds.size} selected`
                : `Select all (${filteredNotifications.length})`}
            </label>
            {selectedIds.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="min-h-[36px] rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--surface)]"
                >
                  Deselect all
                </button>
                <button
                  onClick={handleClearSelected}
                  className="flex min-h-[36px] items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        {/* Undo toast */}
        {undoBuffer && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-900 px-4 py-3 text-white shadow-lg">
            <p className="text-sm">
              Deleted {undoBuffer.length} notification{undoBuffer.length === 1 ? "" : "s"}.
            </p>
            <button
              onClick={handleUndo}
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/20"
            >
              <Undo2 size={12} />
              Undo
            </button>
          </div>
        )}

        {/* Notification list, grouped by time */}
        <div className="space-y-6">
          {groupedNotifications.map((group) => (
            <div key={group.label} className="space-y-3">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {group.label}
              </p>
              <div className="space-y-4">
                {group.items.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3">
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={selectedIds.has(notification._id)}
                        onChange={() => toggleSelect(notification._id)}
                        className="mt-5 h-4 w-4 flex-shrink-0 rounded border-[var(--border)] accent-[var(--primary)]"
                        aria-label={`Select notification: ${notification.title}`}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <NotificationCard notification={notification} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--text-muted)]">
            {searchQuery ? (
              <>No notifications match &ldquo;{searchQuery}&rdquo;.</>
            ) : (
              <>You&apos;re all caught up! No notifications right now.</>
            )}
          </div>
        )}
      </section>
    </AppShell>
  );
}