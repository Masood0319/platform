"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { get, post } from '../../lib/apiClient';
import { getToken, setToken, clearToken } from '../../lib/tokenStorage';
import { logoutUser as centralizedLogout } from '../../lib/auth';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const inFlightRequestRef = useRef(null);

  // ============================================
  // FETCH USER FUNCTION
  // ============================================

  const fetchUser = useCallback(async () => {
    // If a fetch is already in flight, share its result instead of
    // silently returning undefined - callers like the OAuth callback
    // page depend on getting the REAL outcome, not a stale early-out.
    if (inFlightRequestRef.current) {
      return inFlightRequestRef.current;
    }

    const requestPromise = (async () => {
      try {
        setLoading(true);
        setError(null);

        const token = getToken();
        if (!token) {
          setUser(null);
          setLoading(false);
          return null;
        }

        const response = await get('/auth/me');

        if (response?.success && response?.data) {
          const userData = response.data.user || response.data;
          setUser(userData);
          return userData;
        } else {
          clearToken();
          setUser(null);
          return null;
        }
      } catch (error) {
        if (error.status === 401) {
          clearToken();
          setUser(null);
        }
        setError(error.message);
        return null;
      } finally {
        setLoading(false);
        inFlightRequestRef.current = null;
      }
    })();

    inFlightRequestRef.current = requestPromise;
    return requestPromise;
  }, []);

  // ============================================
  // LOGIN FUNCTION
  // ============================================

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await post('/auth/login', { email, password });

      if (response?.success && response?.token) {
        const token = response.token;
        const userData = response.data?.user || response.data;

        setToken(token);
        setUser(userData);

        return { success: true, user: userData };
      } else {
        throw new Error(response?.message || 'Login failed');
      }
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // LOGOUT FUNCTION
  // ------------------------------------------------------------
  // Delegates to the single centralized implementation in
  // lib/auth.js (fixes the old GET /auth/logout 404 bug and
  // avoids having two divergent copies of this logic). Redirect
  // and toast are disabled here because some callers (e.g. the
  // landing page's "switch account" flow) want to stay in place;
  // callers that want the full experience should call
  // logoutUser() from lib/auth.js directly instead.
  // ============================================

  const logout = useCallback(async () => {
    await centralizedLogout({
      redirect: false,
      toast: false,
      onLogout: () => setUser(null),
    });
  }, []);

  const clearUserState = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  const refreshUser = useCallback(async () => {
    return await fetchUser();
  }, [fetchUser]);

  const updateUser = useCallback((updatedData) => {
    setUser(prev => prev ? { ...prev, ...updatedData } : null);
  }, []);

  // ============================================
  // INITIALIZATION AND EVENT LISTENERS
  // ============================================

  useEffect(() => {
    // 1. Initial fetch on mount
    fetchUser();

    // 2. Listen for cross-tab token changes (native "storage" event
    //    only fires in OTHER tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          fetchUser();
        } else {
          setUser(null);
        }
      }
    };

    // 3. Listen for custom unauthorized event dispatched by apiClient
    const handleUnauthorized = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [fetchUser]);

  // ============================================
  // PROVIDER VALUE
  // ============================================

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    fetchUser,
    refreshUser,
    clearUserState,
    updateUser,
    isAuthenticated: !!user,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;