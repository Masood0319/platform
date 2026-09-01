"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getUsers, approveUser, blockUser, deleteUser } from "@/lib/services/adminService";
import { showToast } from "@/lib/toast";

function statusVariant(status) {
  if (status === "active") return "success";
  if (status === "blocked") return "danger";
  return "warning";
}

function AdminUsersContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({ search: search || undefined, role: roleFilter || undefined, limit: 50 });
      setUsers(res.data || []);
    } catch (error) {
      showToast(error.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => {
    const timeout = setTimeout(load, 300); // debounce search
    return () => clearTimeout(timeout);
  }, [load]);

  const handleApprove = async (id) => {
    setBusyId(id);
    try {
      await approveUser(id);
      showToast("User approved");
      load();
    } catch (error) {
      showToast(error.message || "Failed to approve user");
    } finally {
      setBusyId(null);
    }
  };

  const handleBlock = async (id) => {
    const reason = window.prompt("Reason for blocking this user (optional):", "");
    if (reason === null) return; // cancelled
    setBusyId(id);
    try {
      await blockUser(id, reason);
      showToast("User blocked");
      load();
    } catch (error) {
      showToast(error.message || "Failed to block user");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this user? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await deleteUser(id);
      showToast("User deleted");
      load();
    } catch (error) {
      showToast(error.message || "Failed to delete user");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell title="Users" subtitle="Approve, block, or remove platform users">
      <AdminNav />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-white px-3 text-sm text-[var(--text-main)]"
        >
          <option value="">All roles</option>
          <option value="founder">Founder</option>
          <option value="investor">Investor</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <Card className="overflow-x-auto p-0">
        {loading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded bg-[var(--surface)]" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <CardDescription className="p-5">No users found.</CardDescription>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--border)] text-left text-xs uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verified</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const id = u._id || u.id;
                return (
                  <tr key={id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 font-medium text-[var(--text-main)]">{u.name}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant(u.status)}>{u.status || "pending"}</Badge>
                    </td>
                    <td className="px-4 py-3">{u.verified ? "✅" : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {u.status !== "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === id}
                            onClick={() => handleApprove(id)}
                          >
                            Approve
                          </Button>
                        )}
                        {u.status !== "blocked" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={busyId === id}
                            onClick={() => handleBlock(id)}
                          >
                            Block
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === id}
                          onClick={() => handleDelete(id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}

export default function AdminUsersPage() {
  return (
    <AuthGuard requireRole="admin">
      <AdminUsersContent />
    </AuthGuard>
  );
}