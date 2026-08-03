import { apiRequest } from "@/lib/apiClient";
import { showToast } from "@/lib/toast";

export async function logoutUser({ redirect = true, toast = true, router, onLogout } = {}) {
  try {
    await apiRequest("auth/logout", { method: "GET" });
  } catch (_) {
    // Even if the API fails, proceed with local logout to keep UX consistent.
  }

  // Clear ALL auth data from all storage locations
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("email");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("redirectAfterLogin");
  } catch (_) {}

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
