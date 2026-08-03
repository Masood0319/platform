"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/providers/UserProvider";
import { GlobalLoading } from "@/components/ui/global-loading";

/**
 * AuthGuard ensures that only authenticated users can access the wrapped components.
 * If the user is not authenticated after initialization, they are redirected to /login.
 */
export function AuthGuard({ children, requireRole = null }) {
  const { user, loading, isAuthenticated } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.replace("/login");
      } else if (requireRole && user?.role !== requireRole) {
        // Redirect to their respective dashboard if they don't have the required role
        const dest = user?.role ? `/dashboard/${user.role}` : "/role";
        router.replace(dest);
      }
    }
  }, [loading, isAuthenticated, requireRole, user, router]);

  // Show loading state while checking authentication
  if (loading) {
    return <GlobalLoading />;
  }

  // Prevent rendering protected content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Prevent rendering if role is required but doesn't match
  if (requireRole && user?.role !== requireRole) {
    return null;
  }

  return <>{children}</>;
}
