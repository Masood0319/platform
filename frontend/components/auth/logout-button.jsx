"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logoutUser } from "@/lib/auth";
import { useUser } from "@/components/providers/UserProvider";

export function LogoutButton({
  className,
  variant = "ghost",
  size = "sm",
  fullWidth = false,
  label = "Log out",
}) {
  const router = useRouter();
  const { clearUserState } = useUser();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!confirmOpen) return;
    const previous = document.activeElement;
    dialogRef.current?.focus();
    return () => previous?.focus?.();
  }, [confirmOpen]);

  const confirmLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    // Clear UserProvider state synchronously before logout
    clearUserState();
    await logoutUser({ router, onLogout: clearUserState });
  };

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={fullWidth ? `w-full ${className || ""}`.trim() : className}
        onClick={() => setConfirmOpen(true)}
        disabled={loggingOut}
      >
        {loggingOut ? "Signing you out..." : label}
      </Button>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-[var(--text-main)]">
              Are you sure you want to log out?
            </h3>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              You will need to sign in again to access your dashboard.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmOpen(false)}
                disabled={loggingOut}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={confirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? "Signing you out..." : "Log out"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
