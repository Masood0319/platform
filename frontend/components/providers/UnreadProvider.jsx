"use client";

// components/providers/UnreadProvider.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { get } from '../../lib/apiClient';
import { useUser } from './UserProvider';

const UnreadContext = createContext();

export const useUnread = () => {
  const context = useContext(UnreadContext);
  if (!context) {
    throw new Error('useUnread must be used within an UnreadProvider');
  }
  return context;
};

export const UnreadProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Wait for real auth state instead of firing on every mount - this
  // provider used to fire before the token was even written to storage
  // (e.g. during the OAuth redirect), causing a spurious 401 that wiped
  // out an otherwise valid, freshly-issued token.
  const { isAuthenticated } = useUser();

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      setLoading(true);
      const response = await get('/notifications/unread');
      if (response?.success) {
        setUnreadCount(response.data?.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    fetchUnreadCount();
  }, [isAuthenticated, fetchUnreadCount]);

  return (
    <UnreadContext.Provider value={{ unreadCount, loading, fetchUnreadCount }}>
      {children}
    </UnreadContext.Provider>
  );
};

export default UnreadProvider;