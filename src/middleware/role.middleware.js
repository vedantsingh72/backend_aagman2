import apiError from "../utils/apiError.js";

// Role-based authorization middleware
// Checks if user's role is in the allowed roles list
export const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new apiError(403, "Access denied: Insufficient permissions"));
    }
    next();
  };
};
