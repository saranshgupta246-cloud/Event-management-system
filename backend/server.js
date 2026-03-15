import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import { initFirebaseAdmin } from "./config/firebaseAdmin.js";
import authRoutes from "./routes/authRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import leaderRoutes from "./routes/leaderRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import adminStudentRoutes from "./routes/adminStudentRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import userNotificationRoutes from "./routes/userNotificationRoutes.js";
import studentEventRoutes from "./routes/studentEventRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import { clubDrivesRouter, globalDrivesRouter } from "./routes/recruitmentRoutes.js";
import { driveApplyRouter, applicationsRouter } from "./routes/applicationsRoutes.js";
import { protect } from "./middleware/auth.middleware.js";
import { sanitizeRequest } from "./middleware/validate.js";
import { canSendEventChat } from "./utils/chatPermissions.js";
import ChatMessage from "./models/ChatMessage.js";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

initFirebaseAdmin();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// CORS: allow frontend dev server on any localhost port + CLIENT_URL in production
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "http://127.0.0.1:5175",
];
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
  allowedOrigins.push(process.env.CLIENT_URL);
}
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, origin || allowedOrigins[0]);
      cb(null, false);
    },
    credentials: true,
  })
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: [
          "'self'",
          "https://*.firebaseapp.com",
          "https://*.googleapis.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "*.cloudinary.com",
          "*.googleusercontent.com",
        ],
        connectSrc: [
          "'self'",
          "https://*.firebaseapp.com",
          "https://*.googleapis.com",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
        ],
        frameSrc: [
          "'self'",
          "https://*.firebaseapp.com",
          "https://accounts.google.com",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());

app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(sanitizeRequest);

// If MongoDB is not connected, /api returns 503 so frontend gets a clear error instead of network failure
let dbConnected = false;
app.use("/api", (req, res, next) => {
  if (!dbConnected) {
    return res.status(503).json({
      success: false,
      message: "Database unavailable. Is MongoDB running? Start it and restart the backend.",
    });
  }
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests" },
});

app.use(limiter);

app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/admin/students", adminStudentRoutes);  // specific first
  app.use("/api/admin", adminRoutes);                   // general second
  app.use("/api/audit", auditRoutes);
app.use("/api/leader", leaderRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/user-notifications", userNotificationRoutes);
app.use("/api/events", studentEventRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/drives", globalDrivesRouter);
app.use("/api/drives", driveApplyRouter);
app.use("/api", applicationsRouter);
app.use("/api/certificates", certificateRoutes);

app.get("/health", (req, res) => {
  res.json({ success: true, message: "EMS API running" });
});

app.use((err, req, res, next) => {
  const status = err.status ?? err.statusCode ?? 500;
  res.status(status).json({
    success: false,
    message: err.message || "Internal server error",
    data: null,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

// --- Socket.IO setup for realtime chat ---
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Not authorized"));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return next(new Error("User not found"));
    }
    socket.data.user = user;
    next();
  } catch (err) {
    next(new Error("Not authorized"));
  }
});

io.on("connection", (socket) => {
  const user = socket.data.user;

  socket.on("chat:join", (eventId) => {
    if (eventId) {
      socket.join(`event:${eventId}`);
    }
  });

  socket.on("chat:send", async ({ eventId, message }) => {
    try {
      if (!eventId || !message) return;
      const allowed = await canSendEventChat(user, eventId);
      if (!allowed) return;

      const doc = await ChatMessage.create({
        event: eventId,
        sender: user._id,
        senderRole: user.role,
        message: message.trim(),
      });

      const populated = await doc.populate("sender", "name avatar role");

      io.to(`event:${eventId}`).emit("chat:new", populated);
    } catch {
      // swallow errors in socket handler
    }
  });
});

// Start HTTP server so frontend gets CORS/503 instead of "network error" when DB is down
server.listen(PORT, () => {
  console.log("Server on port", PORT);
});

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mits_clubs")
  .then(() => {
    dbConnected = true;
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    console.error("Start MongoDB (e.g. run mongod) and restart the backend. API will return 503 until then.");
  });
