import apiError from "../utils/apiError.js";

// 404 handler for unknown routes
// Cleans URL to remove any trailing whitespace/newlines
const notFound = (req, res, next) => {
  // Clean the URL to remove any trailing whitespace or newlines
  const cleanUrl = req.originalUrl?.trim() || req.url?.trim() || "/";
  next(new apiError(404, `Route not found: ${cleanUrl}`));
};

export default notFound;
