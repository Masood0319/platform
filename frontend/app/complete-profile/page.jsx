"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/apiClient";
import { IndustrySelector } from "@/components/ui/industry-selector";
import { FormSelect } from "@/components/ui/form-select";
import { useUser } from "@/components/providers/UserProvider";

const INVESTMENT_RANGES = [
  { value: "", label: "Select investment range" },
  { value: "0-10k", label: "$0 – $10K" },
  { value: "10k-50k", label: "$10K – $50K" },
  { value: "50k-100k", label: "$50K – $100K" },
  { value: "100k-500k", label: "$100K – $500K" },
  { value: "500k-1m", label: "$500K – $1M" },
  { value: "1m+", label: "$1M+" },
];

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function ProgressBar({ value, label }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-muted)]">{label}</span>
        <span className="font-semibold text-[var(--primary)]">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const { setUser } = useUser();
  const [user, setLocalUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState("");
  const [industries, setIndustries] = useState([]);
  const [investmentRange, setInvestmentRange] = useState("");
  const [startupName, setStartupName] = useState("");

  useEffect(() => {
    let active = true;
    const fetchUser = async () => {
      try {
        const res = await apiRequest("auth/me", { cache: "no-store" });
        if (!active) return;
        const u = res?.data?.user;
        if (!u) {
          router.replace("/login");
          return;
        }
        setLocalUser(u);
        setName(u.name || "");
        setAvatar(u.avatar || "");
        setBio(u.profile?.bio || "");
        setRole(u.role || "");
        setIndustries(u.profile?.industries || []);
        setInvestmentRange(u.profile?.investmentRange || "");
        setStartupName(u.profile?.startupInfo?.companyName || "");
      } catch (err) {
        if (active) router.replace("/login");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchUser();
    return () => { active = false; };
  }, [router]);

  const progress = useMemo(() => {
    let score = 0;
    const total = role === "investor" ? 6 : 5;
    if (name.trim()) score++;
    if (avatar.trim() || bio.trim()) score++;
    if (bio.trim()) score++;
    if (role) score++;
    if (role === "investor") {
      if (industries.length > 0) score++;
      if (investmentRange) score++;
    }
    if (role === "founder") {
      if (startupName.trim()) score++;
    }
    return Math.round((score / total) * 100);
  }, [name, avatar, bio, role, industries, investmentRange, startupName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }
    if (!role) {
      setError("Please select a role");
      return;
    }
    if (role === "investor" && industries.length === 0) {
      setError("Please select at least one industry");
      return;
    }
    if (role === "investor" && !investmentRange) {
      setError("Please select an investment range");
      return;
    }
    if (role === "founder" && !startupName.trim()) {
      setError("Please enter your startup name");
      return;
    }

    const payload = {
      name: name.trim(),
      avatar: avatar.trim() || undefined,
      bio: bio.trim() || undefined,
      role: user?.role ? undefined : role,
    };

    if (role === "investor") {
      payload.industries = industries;
      payload.investmentRange = investmentRange;
    }

    if (role === "founder") {
      payload.startupInfo = {
        companyName: startupName.trim(),
      };
    }

    try {
      const res = await apiRequest("users/profile", {
        method: "PUT",
        data: payload,
        setLoading: setSaving,
      });

      if (res?.data?.user) {
        setUser(res.data.user);
      } else {
        const meRes = await apiRequest("auth/me", { cache: "no-store" });
        if (meRes?.data?.user) {
          setUser(meRes.data.user);
        }
      }

      router.replace("/home");
    } catch (err) {
      setError(err.message || "Failed to save profile");
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-[#050A10] text-white flex items-center justify-center px-6">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600 opacity-20 blur-3xl rounded-full" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600 opacity-20 blur-3xl rounded-full" />
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <span className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span className="text-gray-300">Loading your profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050A10] text-white px-6 py-12">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600 opacity-20 blur-3xl rounded-full" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600 opacity-20 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 mx-auto max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Complete your profile</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Let&apos;s get you set up so you can start connecting
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <ProgressBar value={progress} label="Profile completion" />
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Preview"
                  className="h-24 w-24 rounded-full object-cover border-2 border-white/20"
                  onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
                />
              ) : null}
              <div
                className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-bold text-white"
                style={{ display: avatar ? "none" : "flex" }}
              >
                {getInitials(name)}
              </div>
            </div>
            <div className="w-full">
              <label className="text-sm text-gray-300">Profile photo URL</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="mt-2 w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste an image URL or leave blank to use initials
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm text-gray-300">Full name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              required
              className="mt-2 w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm text-gray-300">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a bit about yourself..."
              rows={3}
              className="mt-2 w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 resize-none"
            />
          </div>

          {/* Role */}
          {!user?.role && (
            <div>
              <label className="text-sm text-gray-300">I am a...</label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {[
                  { key: "investor", label: "Investor" },
                  { key: "founder", label: "Founder" },
                ].map((r) => {
                  const selected = role === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setRole(r.key)}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                        selected
                          ? "border-indigo-500 bg-indigo-500/20 text-white"
                          : "border-white/10 bg-white/5 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Investor-specific */}
          {role === "investor" && (
            <div className="space-y-6 rounded-xl border border-white/10 bg-white/5 p-4">
              <div>
                <label className="text-sm text-gray-300">Industries of interest</label>
                <div className="mt-2">
                  <IndustrySelector selected={industries} onChange={setIndustries} />
                </div>
              </div>
              <div>
                <FormSelect
                  label="Investment range"
                  options={INVESTMENT_RANGES}
                  value={investmentRange}
                  onChange={(e) => setInvestmentRange(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Founder-specific */}
          {role === "founder" && (
            <div className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4">
              <div>
                <label className="text-sm text-gray-300">Startup name</label>
                <input
                  type="text"
                  value={startupName}
                  onChange={(e) => setStartupName(e.target.value)}
                  placeholder="Acme Inc."
                  className="mt-2 w-full rounded-lg bg-white/10 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-semibold transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Complete profile"}
          </button>
        </form>
      </div>
    </div>
  );
}
