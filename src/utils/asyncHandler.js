// Wrapper to handle async errors in Express routes
// Passes errors to Express error handling middleware
// Smart handler: passes next if function expects 3+ parameters (middleware), otherwise only req, res (controller)
const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      // Check if function expects next parameter (middleware) or not (controller)
      // If function.length >= 3, it's a middleware that needs next
      if (fn.length >= 3) {
        await fn(req, res, next);
      } else {
        // Controller function - only pass req and res
        await fn(req, res);
      }
    } catch (error) {
      // Pass error to Express error handling middleware
      next(error);
    }
  };
};

export default asyncHandler;