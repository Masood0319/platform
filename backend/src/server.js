import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { initializeSocketHandlers } from "./sockets/socketHandler.js";

// ============================================
// CONNECT TO DATABASE
// ============================================

connectDB();

// ============================================
// DEFINE CORS ORIGINS (MUST BE DEFINED HERE)
// ============================================

const defaultOrigins = ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"];
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const origins = allowedOrigins.length ? allowedOrigins : defaultOrigins;

// ============================================
// CREATE SERVER
// ============================================

const PORT = process.env.PORT || 5000;
const server = createServer(app);

// ============================================
// SOCKET.IO CONFIGURATION
// ============================================

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || origins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  },
  // Optional: Add socket.io configurations
  pingTimeout: 60000,
  pingInterval: 25000,
});

// ============================================
// INITIALIZE SOCKET HANDLERS
// ============================================

// Pass the io instance to the socket handlers
initializeSocketHandlers(io);

// Store io instance for use in controllers
// This allows you to emit events from anywhere in your app
global.io = io;

// ============================================
// START SERVER
// ============================================

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 CORS origins: ${origins.join(", ")}`);
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

const gracefulShutdown = async () => {
  console.log("\n🛑 Shutting down gracefully...");
  
  // Close socket connections
  io.close(() => {
    console.log("📡 Socket.io connections closed");
  });

  // Close server
  server.close(() => {
    console.log("🔌 HTTP server closed");
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error("⚠️ Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("💥 Uncaught Exception:", error);
  gracefulShutdown();
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("💥 Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown();
});

export { io };