"use client";

// components/providers/SocketProvider.jsx

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useUser } from './UserProvider';
import { getToken } from '../../lib/tokenStorage';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);

  // SocketProvider now lives INSIDE UserProvider (see app/layout.jsx),
  // so it can react directly to real auth state instead of reading
  // localStorage once on mount. This connects/disconnects the socket
  // whenever isAuthenticated actually changes - including logins and
  // logouts that happen in the same tab without a full page reload.
  const { isAuthenticated } = useUser();

  useEffect(() => {
    // Always tear down any existing connection first
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    }

    if (!isAuthenticated) return;

    const token = getToken();
    if (!token) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', () => {
      setIsConnected(false);
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;