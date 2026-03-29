import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { Server as SocketIOServer } from "socket.io";
import passport from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import clubRoutes from "./routes/clubRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import clubLeaderApiRoutes from "./routes/clubLeaderApiRoutes.js";
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
import publicRoutes from "./routes/publicRoutes.js";
import { clubDrivesRouter, globalDrivesRouter } from "./routes/recruitmentRoutes.js";
import { driveApplyRouter, applicationsRouter } from "./routes/applicationsRoutes.js";
import { protect } from "./middleware/auth.middleware.js";
import { sanitizeRequest } from "./middleware/validate.js";
import { canSendEventChat } from "./utils/chatPermissions.js";
import ChatMessage from "./models/ChatMessage.js";
import jwt from "jsonwebtoken";
import User from "./models/User.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Passport
app.use(passport.initialize());

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  
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
        scriptSrc: ["'self'"],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "*.cloudinary.com",
          "*.googleusercontent.com",
        ],
        connectSrc: ["'self'"],
        frameSrc: ["'self'", "https://accounts.google.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Allow more requests during development to avoid 429 spam while iterating.
  // In production, keep a sensible global cap.
  max: process.env.NODE_ENV === "production" ? 300 : 1000,
  message: { success: false, message: "Too many requests" },
});
app.use("/api", limiter);

app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(sanitizeRequest);

// Serve locally stored uploaded files (when Cloudinary is disabled).
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================================
// GOOGLE OAUTH ROUTES - BEFORE DB CHECK
// ============================================
app.get(
  "/api/auth/google",
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    prompt: "select_account"  // Force account selection every time
  })
);

app.get(
  "/api/auth/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      if (err || !user) {
        const code =
          info?.code === "domain_not_allowed" ? "domain_not_allowed" : "auth_failed";
        const url = new URL(`${process.env.CLIENT_URL}/auth/callback`);
        url.searchParams.set("error", code);
        return res.redirect(url.toString());
      }

      req.user = user;
      return next();
    })(req, res, next);
  },
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    const url = new URL(`${process.env.CLIENT_URL}/auth/callback`);
    url.searchParams.set("token", token);
    res.redirect(url.toString());
  }
);

// ============================================
// DB CHECK MIDDLEWARE
// ============================================
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

// ============================================
// ALL OTHER ROUTES
// ============================================
app.use("/api/public", publicRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/admin/students", adminStudentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/coordinator", clubLeaderApiRoutes);
app.use("/api/leader", clubLeaderApiRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/user-notifications", userNotificationRoutes);
app.use("/api/events", studentEventRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/drives", globalDrivesRouter);
app.use("/api/drives", driveApplyRouter);
app.use("/api/applications", applicationsRouter);
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

// ============================================
// SOCKET.IO
// ============================================
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
    if (!token) return next(new Error("Not authorized"));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return next(new Error("User not found"));
    socket.data.user = user;
    next();
  } catch (err) {
    next(new Error("Not authorized"));
  }
});

io.on("connection", (socket) => {
  const user = socket.data.user;

  socket.on("chat:join", (eventId) => {
    if (eventId) socket.join(`event:${eventId}`);
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
      // swallow errors
    }
  });
});

// ============================================
// START SERVER
// ============================================
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
  });