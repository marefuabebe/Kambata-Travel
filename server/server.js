require("dotenv").config();


// FAIL-FAST STARTUP VALIDATION
const requiredEnvVars = ["PORT", "EMAIL_USER", "EMAIL_PASS", "JWT_SECRET", "DATABASE_URI"];
const missingVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingVars.length > 0) {
  console.error("\n[CRITICAL ERROR]: Missing required environment variables.");
  console.error("Please ensure the following variables are set in your .env file or environment:");
  missingVars.forEach((envVar) => console.error(` - ${envVar}`));
  console.error("\nShutting down server to prevent insecure/unstable state.\n");
  process.exit(1);
}

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const http = require("http");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const { cleanupExpiredInvitations, markToursAsCompleted, cleanupAbandonedPayments } = require("./services/bookingService");
const { sendTourReminders } = require("./services/notificationService");
const socketIO = require("./utils/socketIO");
const socketHandler = require("./utils/socketHandler");

// Cron Jobs
const { startExpirationJobs } = require("./cron/expirationJobs");
const { startReminderJobs } = require("./cron/reminderJobs");
const startAttendanceLockCron = require("./cron/attendanceLockCron");
const { startDualBookingCron } = require("./cron/dualBookingCron");
const { startPostTourJobs } = require("./cron/postTourJobs");

const app = express();
const server = http.createServer(app);

// 1. CORS Configuration (Must be before other middleware)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.ADMIN_PORTAL_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "x-device-id"]
}));

// 2. SECURITY BASE (Helmet & Injection Protection)
const helmet = require("helmet");
const { globalLimiter, checkBlacklist } = require("./middleware/securityMiddleware");

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// NoSQL Injection Protection (manual sanitizer)
// Strips MongoDB query operators ($gt, $ne, etc.) from user input
const sanitizeInput = (obj) => {
  if (obj === null || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
    } else if (typeof obj[key] === "object") {
      sanitizeInput(obj[key]);
    }
  }
};
app.use((req, res, next) => {
  if (req.body) sanitizeInput(req.body);
  if (req.query) sanitizeInput(req.query);
  if (req.params) sanitizeInput(req.params);
  next();
});

// Initialize Sockets using the singleton utility

const io = socketIO.init(server);
socketHandler(io);

// Database connection
mongoose
  .connect(process.env.DATABASE_URI)
  .then(() => {
    console.log("MongoDB Connected");
    // Start Waitlist Cleanup (every 5 mins)
    setInterval(cleanupExpiredInvitations, 5 * 60 * 1000);
    // Start Booking Completion (every hour)
    setInterval(markToursAsCompleted, 60 * 60 * 1000);
    // Start Abandoned Payment Cleanup (every 10 mins)
    setInterval(cleanupAbandonedPayments, 10 * 60 * 1000);
    // Start Tour Reminders (every 6 hours)
    setInterval(sendTourReminders, 6 * 60 * 60 * 1000);

    // Advanced Booking Cron Jobs
    startExpirationJobs();
    startReminderJobs();
    startAttendanceLockCron();
    startDualBookingCron();
    startPostTourJobs();
  })
  .catch((err) => console.error("Database connection error:", err));

// Middleware
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));

// 3. SECURITY GUARD (Blacklist & Rate Limit)
app.use(checkBlacklist);
app.use(globalLimiter);

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/guides", require("./routes/guideRoutes"));
app.use("/api/guide", require("./routes/guideRoutes"));
app.use("/api/guide-ops", require("./routes/guideOpsRoutes"));
app.use("/api/tours", require("./routes/tourRoutes"));
app.use("/api/destinations", require("./routes/destinationRoutes"));
app.use("/api/newsletter", require("./routes/newsletterRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/hotels", require("./routes/hotelRoutes"));
app.use("/api/packages", require("./routes/packageRoutes"));
app.use("/api/aichat", require("./routes/aiChatRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/wallets", require("./routes/walletRoutes"));
app.use("/api/wishlist", require("./routes/wishlistRoutes"));
app.use("/api/traveler", require("./routes/travelerRoutes"));
app.use("/api/calendar", require("./routes/calendarRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/gallery", require("./routes/galleryRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/requests", require("./routes/requestRoutes"));
app.use("/api/package-bookings", require("./routes/packageBookingRoutes"));
app.use("/api/analytics", require("./routes/analyticsRoutes"));
app.use("/api/sos", require("./routes/sosRoutes"));
app.use("/api/recommendations", require("./routes/recommendationRoutes"));
app.use("/api/support", require("./routes/supportRoutes"));
app.use("/api/qr", require("./routes/qrVerificationRoutes"));

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// NOTE: Cron jobs are started once in the mongoose.connect().then() block above.
// The duplicate startup block that was previously here has been removed.

// Server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});