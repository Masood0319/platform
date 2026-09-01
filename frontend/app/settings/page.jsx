"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useUser } from "@/components/providers/UserProvider";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import { logoutUser } from "@/lib/auth";
import {
  getProfile,
  updateNotificationPreferences,
  changePassword,
  deleteAccount,
} from "@/lib/services/settingsService";

const TABS = [
  { key: "notifications", label: "Notifications" },
  { key: "password", label: "Password" },
  { key: "privacy", label: "Privacy" },
  { key: "danger", label: "Delete account" },
];

const NOTIFICATION_LABELS = {
  email: "Email notifications",
  push: "Push notifications",
  inApp: "In-app notifications",
  interestUpdates: "Interest updates",
  matchUpdates: "Match updates",
  dealUpdates: "Deal room updates",
  messageNotifications: "New messages",
  marketingEmails: "Marketing emails",
};

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 flex-shrink-0 rounded-full transition-colors",
        checked ? "bg-[var(--primary)]" : "bg-[var(--border)]"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const profile = await getProfile();
        if (active) setPrefs(profile?.notificationPreferences || {});
      } catch (error) {
        showToast(error.message || "Failed to load preferences");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleToggle = async (key, value) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaving(true);
    try {
      await updateNotificationPreferences(next);
    } catch (error) {
      showToast(error.message || "Failed to save preference");
      setPrefs(prefs); // revert on failure
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Card className="h-64 animate-pulse" />;
  }

  return (
    <Card>
      <CardTitle>Notification preferences</CardTitle>
      <CardDescription className="mb-4">Choose which updates you want to receive.</CardDescription>
      <div className="divide-y divide-[var(--border)]">
        {Object.keys(NOTIFICATION_LABELS).map((key) => (
          <div key={key} className="flex items-center justify-between py-3">
            <span className="text-sm text-[var(--text-main)]">{NOTIFICATION_LABELS[key]}</span>
            <Toggle checked={!!prefs?.[key]} onChange={(v) => handleToggle(key, v)} />
          </div>
        ))}
      </div>
      {saving && <p className="mt-3 text-xs text-[var(--text-muted)]">Saving…</p>}
    </Card>
  );
}

function PasswordTab() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      showToast("New password and confirmation don't match");
      return;
    }
    setSubmitting(true);
    try {
      await changePassword(form);
      showToast("Password changed successfully");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error) {
      showToast(error.message || "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardTitle>Change password</CardTitle>
      <CardDescription className="mb-4">Use a strong password you don't use elsewhere.</CardDescription>
      <form onSubmit={handleSubmit} className="space-y-3 max-w-sm">
        <Input
          type="password"
          placeholder="Current password"
          value={form.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
          required
        />
        <Input
          type="password"
          placeholder="New password"
          value={form.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
          required
          minLength={6}
        />
        <Input
          type="password"
          placeholder="Confirm new password"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
          minLength={6}
        />
        <Button type="submit" disabled={submitting}>
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}

function PrivacyTab() {
  return (
    <Card>
      <CardTitle>Privacy</CardTitle>
      <CardDescription>
        Granular privacy controls (e.g. hiding your contact details from certain users) aren't available yet —
        this section is coming in a future update.
      </CardDescription>
    </Card>
  );
}

function DangerTab() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async (e) => {
    e.preventDefault();
    if (confirm !== "DELETE") {
      showToast('Type "DELETE" to confirm');
      return;
    }
    if (!window.confirm("This will permanently delete your account and all data. Continue?")) return;

    setSubmitting(true);
    try {
      await deleteAccount({ password, confirm });
      showToast("Account deleted");
      await logoutUser({ redirect: false, toast: false });
      router.replace("/");
    } catch (error) {
      showToast(error.message || "Failed to delete account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-red-200">
      <CardTitle className="text-red-600">Delete account</CardTitle>
      <CardDescription className="mb-4">
        This permanently deletes your profile, startup(s), matches, deals, and messages. This cannot be undone.
      </CardDescription>
      <form onSubmit={handleDelete} className="space-y-3 max-w-sm">
        <Input
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          placeholder='Type "DELETE" to confirm'
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        <Button type="submit" variant="outline" className="border-red-300 text-red-600 hover:bg-red-50" disabled={submitting}>
          {submitting ? "Deleting…" : "Permanently delete account"}
        </Button>
      </form>
    </Card>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    TABS.some((t) => t.key === initialTab) ? initialTab : "notifications"
  );

  return (
    <AppShell title="Settings" subtitle="Manage your account and preferences">
      <div className="mb-6 flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition",
              activeTab === tab.key
                ? "bg-[var(--primary)] text-white"
                : "text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-main)]"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "notifications" && <NotificationsTab />}
      {activeTab === "password" && <PasswordTab />}
      {activeTab === "privacy" && <PrivacyTab />}
      {activeTab === "danger" && <DangerTab />}
    </AppShell>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <Suspense fallback={null}>
        <SettingsContent />
      </Suspense>
    </AuthGuard>
  );
}