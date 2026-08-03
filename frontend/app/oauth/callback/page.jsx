"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const error = useMemo(() => searchParams.get("error") || "", [searchParams]);
  const [message, setMessage] = useState("Authenticating...");
  const { refreshUser } = useUser();

  useEffect(() => {
    let active = true;

    const initializeAuth = async () => {
      if (error) {
        if (active) router.replace(`/login?error=${encodeURIComponent(error)}`);
        return;
      }

      if (!token) {
        if (active) router.replace("/login?error=oauth_failed");
        return;
      }

      try {
        setMessage("Setting up your session...");
        
        // Store token immediately
        localStorage.setItem("token", token);
        
        // Fetch fresh user data directly from the provider
        const user = await refreshUser();
        
        if (!active) return;
        
        if (user) {
          setMessage("Redirecting...");
          // Navigate to role selection or dashboard based on user state
          const dest = user.role ? `/dashboard/${user.role}` : "/role";
          router.replace(dest);
        } else {
          router.replace("/login?error=auth_sync_failed");
        }
      } catch (err) {
        if (active) router.replace("/login?error=oauth_failed");
      }
    };

    initializeAuth();

    return () => {
      active = false;
    };
  }, [error, token, router, refreshUser]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#050A10] text-white flex items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600 opacity-20 blur-3xl rounded-full" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600 opacity-20 blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-xl text-center">
        <div className="flex items-center justify-center mb-4">
          <span className="h-10 w-10 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
        <h1 className="text-xl font-semibold">Signing you in...</h1>
        <p className="mt-2 text-sm text-gray-300">{message}</p>
      </div>
    </div>
  );
}
