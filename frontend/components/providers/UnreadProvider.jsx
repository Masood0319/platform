"use client";

// components/providers/UnreadProvider.jsx

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { get } from '../../lib/apiClient';

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

  const fetchUnreadCount = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return (
    <UnreadContext.Provider value={{ unreadCount, loading, fetchUnreadCount }}>
      {children}
    </UnreadContext.Provider>
  );
};

export default UnreadProvider;