// frontend/lib/socket.js
import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const normalizedUrl = baseUrl.replace(/\/+$/, '');

  socket = io(normalizedUrl, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;