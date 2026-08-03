"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION = 3000;

export function ToastHost() {
  const [toast, setToast] = useState(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const onToast = (event) => {
      const detail = event?.detail || {};
      const message = detail.message || "";
      if (!message) return;

      setToast({ message, id: Date.now() });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setToast(null), detail.duration || DEFAULT_DURATION);
    };

    window.addEventListener("app:toast", onToast);
    return () => {
      window.removeEventListener("app:toast", onToast);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed right-4 top-4 z-[100]">
      <div className="rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--text-main)] shadow-lg">
        {toast.message}
      </div>
    </div>
  );
}
