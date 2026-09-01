// lib/apiClient.js

import { getToken, clearToken } from "./tokenStorage";

// ============================================
// API CLIENT CONFIGURATION
// ============================================

const getBaseUrl = () => {
  const configuredBase = process.env.NEXT_PUBLIC_API_URL;
  if (configuredBase) {
    return configuredBase;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return 'http://localhost:5000';
};

export const toApiUrl = (route) => {
  const baseUrl = getBaseUrl().replace(/\/+$/, '');
  const cleanRoute = route.startsWith('/') ? route : `/${route}`;
  const baseWithApi = /\/api$/i.test(baseUrl) ? baseUrl : `${baseUrl}/api`;
  return `${baseWithApi}${cleanRoute}`;
};

// ============================================
// CREATE API ERROR
// ============================================

export const createApiError = (response, payload) => {
  const message =
    payload?.message ||
    payload?.error ||
    (response?.status ? `Request failed (${response.status})` : "Request failed");
  const error = new Error(message);
  error.status = response?.status || 0;
  error.payload = payload || null;
  return error;
};

// ============================================
// HANDLE UNAUTHORIZED RESPONSE
// ------------------------------------------------------------
// IMPORTANT: only treat a 401 as "the session died" if a token was
// actually attached to THIS request. A 401 from a request that never
// had a token in the first place (e.g. a provider that fired before
// auth state was ready) is completely normal and must NOT wipe out a
// token that may have just been - or is about to be - set by another
// in-flight request (this previously caused a real bug: a stray
// unauthenticated request during the OAuth redirect would wipe a
// freshly-issued, perfectly valid token milliseconds after login).
// ============================================

const handleUnauthorized = (status, hadToken) => {
  if (status === 401 && hadToken) {
    clearToken();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return true;
  }
  return false;
};

// ============================================
// MAIN API REQUEST FUNCTION
// ============================================

export const apiRequest = async (route, options = {}) => {
  const url = toApiUrl(route);

  // Get token from centralized storage
  const token = getToken();

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const method = (options.method || 'GET').toUpperCase();
  const init = {
    ...options,
    method,
    headers,
  };

  // Send JSON body for non-GET/HEAD requests
  if (!['GET', 'HEAD'].includes(method)) {
    const hasExplicitBody = Object.prototype.hasOwnProperty.call(options, 'body');
    const hasData = Object.prototype.hasOwnProperty.call(options, 'data');
    const bodyValue = hasExplicitBody
      ? options.body
      : hasData
        ? options.data
        : undefined;

    if (bodyValue !== undefined) {
      init.body = typeof bodyValue === 'string' ? bodyValue : JSON.stringify(bodyValue);
    }
  } else {
    delete init.body;
  }

  let response;
  let payload = null;

  try {
    response = await fetch(url, init);
  } catch (networkError) {
    // The request never reached the server (offline, CORS rejection, backend down, etc.)
    const error = new Error('Network error - please check your connection and try again.');
    error.status = 0;
    error.cause = networkError;
    throw error;
  }

  try {
    payload = await response.json();
  } catch {
    // Response had no JSON body - that's fine for some endpoints (e.g. 204s)
    payload = null;
  }

  // Handle 401 Unauthorized
  if (response.status === 401) {
    handleUnauthorized(response.status, !!token);
    throw createApiError(response, payload || { message: 'Session expired. Please login again.' });
  }

  // Handle other error statuses
  if (!response.ok) {
    throw createApiError(response, payload);
  }

  return payload;
};

// ============================================
// HELPER METHODS
// ============================================

export const get = (route, options = {}) => {
  return apiRequest(route, { ...options, method: 'GET' });
};

export const post = (route, data, options = {}) => {
  return apiRequest(route, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const put = (route, data, options = {}) => {
  return apiRequest(route, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const patch = (route, data, options = {}) => {
  return apiRequest(route, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const del = (route, options = {}) => {
  return apiRequest(route, { ...options, method: 'DELETE' });
};