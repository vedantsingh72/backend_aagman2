import jwt from "jsonwebtoken";
import apiError from "../utils/apiError.js";

// JWT authentication middleware
// Verifies JWT token from Authorization header
export const verifyJWT = (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      return next(new apiError(401, "Unauthorized: Token missing"));
    }

    const token = auth.split(" ")[1];

    if (!process.env.ACCESS_TOKEN_SECRET) {
      return next(
        new apiError(500, "Server configuration error: ACCESS_TOKEN_SECRET not set")
      );
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Handle JWT specific errors
    if (error.name === "JsonWebTokenError") {
      return next(new apiError(401, "Unauthorized: Invalid token"));
    }
    if (error.name === "TokenExpiredError") {
      return next(new apiError(401, "Unauthorized: Token expired"));
    }
    // Pass other errors to error handler
    next(error);
  }
};
