import { Router } from "express";
import {
  registerUser,
  getMyProfile,
} from "../controllers/user.controller.js";

import { validate } from "../middleware/validate.middleware.js";
import { registerUserSchema } from "../schemas/user.schema.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { attachUser } from "../middleware/attachuser.middleware.js";

const router = Router();

// POST /api/users/register - Register a new user
router.post("/register", validate(registerUserSchema), registerUser);

// GET /api/users/register - Test endpoint to verify route is registered
router.get("/register", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Register route is accessible. Use POST method with user data.",
    method: "POST",
    endpoint: "/api/users/register"
  });
});

// GET /api/users/me - Get current user profile (requires authentication)
router.get(
  "/me",
  verifyJWT,
  allowRoles("user"),
  attachUser,
  getMyProfile
);

export default router;
