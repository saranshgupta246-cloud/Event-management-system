import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import { Server as SocketIOServer } from "socket.io";
import { initFirebaseAdmin } from "./config/firebaseAdmin.js";
import authRoutes from "./routes/authRoutes.js";
import clubRoutes from "./routes/clubs.routes.js";
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
import { clubDrivesRouter, globalDrivesRouter } from "./routes/recruitment.routes.js";
import { driveApplyRouter, applicationsRouter } from "./routes/applications.routes.js";
import { protect } from "./middleware/authMiddleware.js";
import { canSendEventChat } from "./utils/chatPermissions.js";
import ChatMessage from "./models/ChatMessage.js";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

initFirebaseAdmin();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(morgan("dev"));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests" },
});
app.use(limiter);

app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/leader", leaderRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin/students", adminStudentRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/user-notifications", userNotificationRoutes);
app.use("/api/events", studentEventRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/drives", globalDrivesRouter);
app.use("/api/drives", driveApplyRouter);
app.use("/api", applicationsRouter);

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
    origin: "*",
    methods: ["GET", "POST"],
  },
});

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

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mits_clubs")
  .then(() => {
    server.listen(PORT, () => {
      console.log("Server on port", PORT);
    });
  })
  .catch((err) => {
    console.error("DB connection failed", err);
    process.exit(1);
  });
