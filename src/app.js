import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import passRoutes from "./routes/pass.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import academicRoutes from "./routes/academic.routes.js";
import hostelofficeRoutes from "./routes/hosteloffice.routes.js";
import gateRoutes from "./routes/gates.routes.js";

import errorHandler from "./middleware/error.middleware.js";
import notFound from "./middleware/notfound.middleware.js";

const app = express();

/* -------------------- GLOBAL MIDDLEWARE -------------------- */

// Security Headers (Helmet equivalent - basic security)
app.use((req, res, next) => {
  // Prevent XSS attacks
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  // Prevent MIME type sniffing
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// Enable CORS - Production safe
const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',')
  : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173', 'http://localhost:3000']);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      if (process.env.NODE_ENV === 'development' || allowedOrigins.length === 0) {
        // Development: allow all origins
        return callback(null, true);
      }
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parse JSON bodies
app.use(express.json({ limit: "16kb" }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

/* -------------------- ROUTES -------------------- */

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/passes", passRoutes);
app.use("/api/department", departmentRoutes);
app.use("/api/academic", academicRoutes);
app.use("/api/hosteloffice", hostelofficeRoutes);
app.use("/api/gate", gateRoutes);

// Basic API route
app.get("/api", (req, res) => {
  res.json({
    message: "This is your first API",
  });
});

// Root route
app.get("/", (req, res) => {
  res.json({ message: "Backend is connected successfully 🚀" });
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

/* -------------------- 404 HANDLER -------------------- */

app.use(notFound);

/* -------------------- GLOBAL ERROR HANDLER -------------------- */

app.use(errorHandler);

export default app;
