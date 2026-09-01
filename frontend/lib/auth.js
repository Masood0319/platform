import { apiRequest } from "@/lib/apiClient";
import { clearToken } from "@/lib/tokenStorage";
import { showToast } from "@/lib/toast";

// ============================================================
// CENTRALIZED LOGOUT
// ------------------------------------------------------------
// The single implementation of "log the user out". UserProvider's
// context `logout()` delegates here (with redirect/toast disabled
// so pages like the landing page can stay put), and anything that
// wants the full experience (toast + redirect) can call this
// directly, e.g. the logout button.
// ============================================================

export async function logoutUser({ redirect = true, toast = true, router, onLogout } = {}) {
  try {
    // Backend route is POST /auth/logout - GET was silently 404ing.
    await apiRequest("auth/logout", { method: "POST" });
  } catch (_) {
    // Even if the API fails, proceed with local logout to keep UX consistent.
  }

  // Clear the token from the single source of truth
  clearToken();

  // Dispatch global unauthorized event so all providers sync immediately
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'));
  }

  // Call onLogout callback for custom integration
  if (typeof onLogout === "function") {
    onLogout();
  }

  if (toast) {
    showToast("You have been logged out");
  }

  if (redirect) {
    if (router?.replace) {
      // Use replace instead of push to prevent back-button issues
      router.replace("/login");
    } else if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }
}