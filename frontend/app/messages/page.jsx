"use client";

import { AppShell } from "@/components/layout/app-shell";
import { RealtimeChat } from "@/components/chat/realtime-chat";
import { useSocket } from "@/components/providers/SocketProvider";

export default function MessagesPage() {
  const { emit } = useSocket();

  return (
    <AppShell
      title="Messages"
      subtitle="Stay in sync with founders and investors across your active deals."
    >
      <RealtimeChat emit={emit} />
    </AppShell>
  );
}
