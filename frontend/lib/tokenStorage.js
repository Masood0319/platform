// lib/tokenStorage.js

// ============================================================
// TOKEN STORAGE
// ------------------------------------------------------------
// Single source of truth for reading/writing/clearing the JWT.
// Every other module (apiClient, auth, UserProvider,
// SocketProvider, oauth callback, etc.) should go through this
// file instead of touching localStorage/sessionStorage directly.
//
// It also dispatches a same-tab "auth:token-changed" event,
// because the native "storage" event only fires in OTHER tabs -
// components like SocketProvider need to react in THIS tab too.
// ============================================================

const TOKEN_KEY = "token";

export function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setToken(token) {
  if (typeof window === "undefined" || !token) return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY); // avoid a stale copy in the other store
  } catch {
    // ignore storage errors (e.g. private browsing)
  }
  window.dispatchEvent(new CustomEvent("auth:token-changed", { detail: { token } }));
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new CustomEvent("auth:token-changed", { detail: { token: null } }));
}

export function hasToken() {
  return !!getToken();
}