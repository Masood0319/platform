import { CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function MessageBubble({
  text,
  me,
  time,
  read,
}) {
  return (
    <div className={cn("flex", me ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm", me ? "bg-[var(--primary)] text-white" : "bg-[var(--surface)] text-[var(--text-main)]")}>
        <p>{text}</p>
        <div className={cn("mt-1 flex items-center gap-1 text-[11px]", me ? "text-blue-100" : "text-[var(--text-muted)]")}>
          <span>{time}</span>
          {me && read && <CheckCheck size={12} />}
        </div>
      </div>
    </div>
  );
}
