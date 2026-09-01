"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getContactMessages, updateContactMessageStatus } from "@/lib/services/contactService";
import { showToast } from "@/lib/toast";

function AdminMessagesContent() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getContactMessages({ status: statusFilter || undefined, limit: 50 });
      setMessages(res.data || []);
    } catch (error) {
      showToast(error.message || "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkStatus = async (id, status) => {
    setBusyId(id);
    try {
      await updateContactMessageStatus(id, status);
      load();
    } catch (error) {
      showToast(error.message || "Failed to update message");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell title="Contact messages" subtitle="Submissions from the public contact form">
      <AdminNav />

      <div className="mb-4 flex gap-2">
        {["", "new", "read", "responded"].map((s) => (
          <Button
            key={s || "all"}
            size="sm"
            variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}
          >
            {s ? s[0].toUpperCase() + s.slice(1) : "All"}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="h-24 animate-pulse" />
          ))}
        </div>
      ) : messages.length === 0 ? (
        <Card>
          <CardDescription>No messages for this filter.</CardDescription>
        </Card>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const id = msg._id || msg.id;
            return (
              <Card key={id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--text-main)]">{msg.name}</p>
                      <Badge
                        variant={
                          msg.status === "responded" ? "success" : msg.status === "read" ? "outline" : "warning"
                        }
                      >
                        {msg.status || "new"}
                      </Badge>
                    </div>
                    <a href={`mailto:${msg.email}`} className="text-sm text-[var(--primary)] hover:underline">
                      {msg.email}
                    </a>
                    {msg.subject && (
                      <p className="mt-1 text-sm font-medium text-[var(--text-main)]">{msg.subject}</p>
                    )}
                    <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-muted)]">{msg.message}</p>
                    <p className="mt-2 text-xs text-[var(--text-muted)]">
                      {msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    {msg.status !== "read" && msg.status !== "responded" && (
                      <Button size="sm" variant="outline" disabled={busyId === id} onClick={() => handleMarkStatus(id, "read")}>
                        Mark read
                      </Button>
                    )}
                    {msg.status !== "responded" && (
                      <Button size="sm" variant="outline" disabled={busyId === id} onClick={() => handleMarkStatus(id, "responded")}>
                        Mark responded
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}

export default function AdminMessagesPage() {
  return (
    <AuthGuard requireRole="admin">
      <AdminMessagesContent />
    </AuthGuard>
  );
}