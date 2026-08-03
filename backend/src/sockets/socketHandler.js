// backend/src/sockets/socketHandler.js
import { verifyAuthToken } from "../lib/auth/jwt.js";
import { io } from "../server.js";

// In-memory store for user sockets (use Redis in production)
const userSockets = new Map();

export function initializeSocketHandlers() {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      // Shared JWT verification (single source of truth)
      const decoded = verifyAuthToken(token);
      socket.user = decoded;
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`User ${userId} connected`);

    // Store socket for this user
    userSockets.set(userId, socket.id);

    // Join user-specific room
    socket.join(`user_${userId}`);
    
    // Broadcast online status
    io.emit("user:online", { userId });

    socket.on("join_conversation", (data) => {
      if (data.conversationId) {
        socket.join(`conversation_${data.conversationId}`);
        console.log(`User ${userId} joined conversation ${data.conversationId}`);
      }
    });

    socket.on("leave_conversation", (data) => {
      if (data.conversationId) {
        socket.leave(`conversation_${data.conversationId}`);
      }
    });

    socket.on("typing", (data) => {
      if (data.conversationId) {
        socket.to(`conversation_${data.conversationId}`).emit("typing", {
          conversationId: data.conversationId,
          userId: userId,
          isTyping: data.isTyping,
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User ${userId} disconnected`);
      userSockets.delete(userId);
      io.emit("user:offline", { userId });
    });
  });
}

// Helper function to emit to specific user
export function emitToUser(userId, event, data) {
  const socketId = userSockets.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
  }
}

// Helper function to emit to user room
export function emitToUserRoom(userId, event, data) {
  io.to(`user_${userId}`).emit(event, data);
}

// Helper function to emit to conversation room
export function emitToConversationRoom(conversationId, event, data) {
  io.to(`conversation_${conversationId}`).emit(event, data);
}