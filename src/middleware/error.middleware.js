import apiError from "../utils/apiError.js";

// Centralized error handling middleware
// Handles all errors thrown in the application
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Handle validation errors (Zod)
  if (err.name === "ZodError") {
    statusCode = 400;
    message = err.errors?.[0]?.message || "Validation error";
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // Log error for debugging (only in development)
  // In production, log to error tracking service (Sentry, etc.)
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
  } else {
    // Production: Log errors without stack traces to console
    console.error(`[${statusCode}] ${message}`);
  }

  // Ensure we have a valid response object before sending
  if (!res.headersSent) {
    res.status(statusCode).json({
      success: false,
      message,
      // Only include stack trace in development
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }
};

export default errorHandler;
