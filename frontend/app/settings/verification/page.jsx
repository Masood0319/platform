"use client";

import { useEffect, useState, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/components/providers/UserProvider";
import { showToast } from "@/lib/toast";
import { apiRequest } from "@/lib/apiClient";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { BadgeCheck, Upload, FileText, X } from "lucide-react";

export default function VerificationPage() {
  const { user, refreshUser } = useUser();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [idNumber, setIdNumber] = useState("");
  const [idType, setIdType] = useState("company_registration");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiRequest("verification/status");
        setStatus(res.data);
      } catch (err) {
        setStatus({ status: "not_submitted" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected].slice(0, 5));
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      showToast("Please upload at least one document");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("type", user?.role || "founder");
      formData.append("idNumber", idNumber);
      formData.append("idType", idType);
      files.forEach((file) => formData.append("documents", file));

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/verification`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      showToast("Verification submitted successfully");
      setStatus({ status: "pending", message: "Your verification is being reviewed" });
      setFiles([]);
      await refreshUser();
    } catch (err) {
      showToast(err.message || "Failed to submit verification");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <AppShell title="Verification">
          <div className="rounded-xl border border-[var(--border)] bg-white p-8 text-center text-sm text-[var(--text-muted)]">
            Loading...
          </div>
        </AppShell>
      </AuthGuard>
    );
  }

  const isVerified = status?.status === "approved" || user?.verified || user?.verificationBadge;
  const isPending = status?.status === "pending";
  const isRejected = status?.status === "rejected";

  return (
    <AuthGuard>
      <AppShell
        title="Account Verification"
        subtitle="Get a verified badge by uploading your documents"
      >
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Status card */}
          <div className="rounded-xl border border-[var(--border)] bg-white p-6">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  isVerified
                    ? "bg-emerald-100 text-emerald-600"
                    : isPending
                    ? "bg-amber-100 text-amber-600"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <BadgeCheck size={24} />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-main)]">
                  {isVerified
                    ? "Verified Account"
                    : isPending
                    ? "Verification Pending"
                    : isRejected
                    ? "Verification Rejected"
                    : "Not Verified"}
                </p>
                <p className="text-sm text-[var(--text-muted)]">
                  {status?.message ||
                    (isVerified
                      ? "Your account has a verified badge."
                      : "Upload documents to get verified.")}
                </p>
              </div>
            </div>
          </div>

          {/* Upload form (only if not verified / not pending) */}
          {!isVerified && !isPending && (
            <form
              onSubmit={handleSubmit}
              className="rounded-xl border border-[var(--border)] bg-white p-6 space-y-5"
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">
                  Document Type
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full rounded-md border border-[var(--border)] bg-white px-3 py-2 text-sm"
                >
                  {user?.role === "founder" ? (
                    <option value="company_registration">Company Registration Certificate</option>
                  ) : (
                    <>
                      <option value="accreditation">Investor Accreditation Proof</option>
                      <option value="passport">Passport</option>
                      <option value="national_id">National ID</option>
                    </>
                  )}
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">
                  Document / Registration Number (optional)
                </label>
                <Input
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. CR-123456 or License number"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--text-main)]">
                  Upload Documents
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--border)] bg-[var(--surface)] px-4 py-8 text-sm text-[var(--text-muted)] hover:border-[var(--primary)]/40"
                >
                  <Upload size={22} />
                  <span>Click to upload PDF or images (max 5)</span>
                </button>

                {files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {files.map((file, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-md border border-[var(--border)] px-3 py-2 text-sm"
                      >
                        <span className="flex items-center gap-2 truncate">
                          <FileText size={14} />
                          {file.name}
                        </span>
                        <button type="button" onClick={() => removeFile(i)}>
                          <X size={14} className="text-[var(--text-muted)]" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Submitting..." : "Submit for Verification"}
              </Button>
            </form>
          )}
        </div>
      </AppShell>
    </AuthGuard>
  );
}