// lib/apiClient.js

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
// ============================================

const handleUnauthorized = (status) => {
  if (status === 401) {
    // Clear token storage directly in case UserProvider hasn't caught it yet
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      } catch (e) {
        // ignore
      }
      
      // Dispatch a custom event so the application (e.g. UserProvider or AuthGuard)
      // can gracefully handle the unauthenticated state without a hard page reload or flash.
      // This eliminates the redirect loop and landing page flash bugs.
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return true; // Indicates unauthorized was handled
  }
  return false;
};

// ============================================
// MAIN API REQUEST FUNCTION
// ============================================

export const apiRequest = async (route, options = {}) => {
  const url = toApiUrl(route);
  
  // Get token from localStorage
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token') || sessionStorage.getItem('token');
  }
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const method = (options.method || 'GET').toUpperCase();
  const init = {
    ...options,
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

  try {
    console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);

    const response = await fetch(url, init);
    
    // Parse response
    let payload = null;
    try {
      payload = await response.json();
    } catch (parseError) {
      // If response is not JSON
      console.warn('Response is not JSON:', response.status);
    }

    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.warn('🔒 Unauthorized request, redirecting to login...');
      handleUnauthorized(response.status);
      throw createApiError(response, payload || { message: 'Session expired. Please login again.' });
    }

    // Handle other error statuses
    if (!response.ok) {
      const error = createApiError(response, payload);
      throw error;
    }

    console.log(`✅ API Success: ${route}`);
    return payload;
  } catch (error) {
    console.error(`❌ API Request Failed: ${route}`, error);
    
    // If it's a network error, don't redirect
    if (error.message === 'Failed to fetch' || error.status === 0) {
      console.error('🔴 Network error - Backend may be down');
      // Don't redirect for network errors, just throw
    }
    
    throw error;
  }
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