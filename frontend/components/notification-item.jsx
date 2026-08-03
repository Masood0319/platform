import { CardDescription, CardTitle } from "@/components/ui/card";

export function NotificationItem({ title, subtitle, time }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-3">
      <CardTitle className="text-sm">{title}</CardTitle>
      <CardDescription className="mt-1 text-xs">{subtitle}</CardDescription>
      <p className="mt-2 text-xs font-medium text-[var(--secondary)]">{time}</p>
    </div>
  );
}
