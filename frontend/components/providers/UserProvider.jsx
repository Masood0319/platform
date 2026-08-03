"use client";

import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { get, post } from '../../lib/apiClient';

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
  const isFetchingRef = useRef(false);

  // ============================================
  // FETCH USER FUNCTION
  // ============================================

  const fetchUser = useCallback(async () => {
    // Prevent overlapping fetch requests
    if (isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await get('/auth/me');
      
      if (response?.success && response?.data) {
        const userData = response.data.user || response.data;
        setUser(userData);
        return userData;
      } else {
        localStorage.removeItem('token');
        setUser(null);
        return null;
      }
    } catch (error) {
      if (error.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
      setError(error.message);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
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
        
        localStorage.setItem('token', token);
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
  // ============================================

  const logout = useCallback(async () => {
    try {
      await get('/auth/logout');
    } catch (_) {
      // Ignore network errors on logout
    }

    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    setUser(null);
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

    // 2. Listen for cross-tab token changes
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
