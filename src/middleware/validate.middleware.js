import apiError from "../utils/apiError.js";

// Request validation middleware using Zod schemas
// Validates request body against provided schema
export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    // Pass validation errors to error handler
    return next(
      new apiError(400, err.errors?.[0]?.message || "Invalid request data")
    );
  }
};
