import {
  Bell,
  Handshake,
  MessageSquare,
  PiggyBank,
  Sparkles,
} from "lucide-react";

const typeConfig = {
  investment: {
    label: "Investment",
    icon: PiggyBank,
    tone: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  startup_interest: {
    label: "Startup Interest",
    icon: Sparkles,
    tone: "bg-amber-100 text-amber-700 border-amber-200",
  },
  message: {
    label: "Message",
    icon: MessageSquare,
    tone: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  deal: {
    label: "Deal",
    icon: Handshake,
    tone: "bg-rose-100 text-rose-700 border-rose-200",
  },
  alert: {
    label: "Alert",
    icon: Bell,
    tone: "bg-slate-100 text-slate-700 border-slate-200",
  },
};

export function NotificationCard({ notification }) {
  const config = typeConfig[notification.type] || typeConfig.alert;
  const Icon = config.icon;

  return (
    <div
      className={`group rounded-xl border bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[var(--surface)] hover:shadow-md ${
        notification.isRead ? "" : "border-[color:var(--secondary)]/40"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${config.tone}`}
        >
          <Icon size={18} />
        </div>

        <div className="flex-1">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="text-sm font-semibold text-[var(--text-main)]">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {notification.description}
              </p>
            </div>

            {!notification.isRead && (
              <span className="mt-1 h-2 w-2 rounded-full bg-[var(--secondary)]" />
            )}
          </div>
        </div>

        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center">
          <span className="text-xs font-medium text-[var(--text-muted)]">
            {notification.time}
          </span>
          <span
            className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
              notification.isRead
                ? "border-transparent bg-[var(--surface)] text-[var(--text-muted)]"
                : "border-[color:var(--secondary)]/30 bg-[color:var(--secondary)]/10 text-[var(--secondary)]"
            }`}
          >
            {notification.isRead ? "Read" : "Unread"}
          </span>
        </div>
      </div>
    </div>
  );
}
