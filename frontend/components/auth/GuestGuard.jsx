"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { GlobalLoading } from "@/components/ui/global-loading";

/**
 * GuestGuard ensures that only unauthenticated users can access the wrapped components.
 * If the user is authenticated, they are redirected to their dashboard.
 */
export function GuestGuard({ children }) {
  const { user, loading, isAuthenticated } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Redirect to their respective dashboard if already authenticated
      const dest = user?.role ? `/dashboard/${user.role}` : "/role";
      router.replace(dest);
    }
  }, [loading, isAuthenticated, user, router]);

  // Show loading state while checking authentication
  if (loading) {
    return <GlobalLoading />;
  }

  // Prevent rendering if authenticated
  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
