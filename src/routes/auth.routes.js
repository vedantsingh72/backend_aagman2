import { Router } from "express";
import { login } from "../controllers/authentication.controller.js";
import { getMyProfile, verifyOTPController, resendOTP, forgotPassword, resetPassword, updatePassword } from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema } from "../schemas/auth.schema.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { attachUser } from "../middleware/attachuser.middleware.js";

const router = Router();

// POST /api/auth/login - Login endpoint (requires role, identifier, password)
router.post("/login", validate(loginSchema), login);

// POST /api/auth/verify-otp - Verify OTP for email verification
router.post("/verify-otp", verifyOTPController);

// POST /api/auth/resend-otp - Resend OTP
router.post("/resend-otp", resendOTP);

// POST /api/auth/forgot-password - Send OTP for password reset
router.post("/forgot-password", forgotPassword);

// POST /api/auth/reset-password - Reset password using OTP
router.post("/reset-password", resetPassword);

// POST /api/auth/update-password - Update password (authenticated users)
router.post("/update-password", verifyJWT, updatePassword);

// GET /api/auth/me - Get current user profile (works for all roles)
router.get("/me", verifyJWT, attachUser, getMyProfile);

// GET /api/auth/login - Test endpoint to verify route is registered
router.get("/login", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Login route is accessible. Use POST method with body: { role, identifier, password }",
    method: "POST",
    endpoint: "/api/auth/login",
    requiredFields: {
      role: "user | department | academic | hosteloffice | gate",
      identifier: "rollNo/departmentId/academicId/etc based on role",
      password: "user password"
    }
  });
});

export default router;
