"use client";

import { useEffect, useState } from "react";
import { BRAND_NAME } from "@/config/branding";

export function GlobalLoading() {
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    const timer = setTimeout(() => setMessage("Almost there..."), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-white/10 bg-white/10 px-8 py-6 text-white shadow-2xl animate-fade-in">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse-slow" />
          <div className="h-12 w-12 rounded-full border-2 border-white/60 border-t-transparent animate-spin" />
        </div>
        <div className="text-[11px] uppercase tracking-[0.3em] text-white/70">
          {BRAND_NAME}
        </div>
        <p className="text-sm font-medium text-white/90">{message}</p>
      </div>
    </div>
  );
}
