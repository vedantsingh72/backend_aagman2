import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { attachUser } from "../middleware/attachuser.middleware.js";
import { User } from "../models/user.model.js";
import { Department } from "../models/department.model.js";
import { Academic } from "../models/academic.model.js";
import { HostelOffice } from "../models/hosteloffice.model.js";
import { Gate } from "../models/gate.model.js";
import { verifyOTP, generateOTP, hashOTP, getOTPExpiry } from "../utils/otp.utils.js";
import { sendOTPEmail } from "../utils/email.utils.js";
import { logOTPToConsole } from "../utils/email-dev-mode.js";


export const getMyProfile = asyncHandler(async (req, res) => {
  // attachUser middleware should have attached req.account
  if (!req.account) {
    throw new apiError(404, "Account not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, req.account, "Profile fetched successfully"));
});


export const verifyOTPController = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new apiError(400, "Email and OTP are required");
  }

  // Try to find account in all role models
  const models = [
    { model: User, name: "User" },
    { model: Department, name: "Department" },
    { model: Academic, name: "Academic" },
    { model: HostelOffice, name: "HostelOffice" },
    { model: Gate, name: "Gate" },
  ];

  let account = null;
  let accountModel = null;

  for (const { model, name } of models) {
    account = await model.findOne({ email });
    if (account) {
      accountModel = model;
      break;
    }
  }

  if (!account) {
    throw new apiError(404, "Account not found with this email");
  }

  // Check if already verified
  if (account.isVerified) {
    return res
      .status(200)
      .json(new apiResponse(200, null, "Email already verified"));
  }

  // Check if OTP exists
  if (!account.otp) {
    throw new apiError(400, "No OTP found. Please register again.");
  }

  // Check if OTP expired
  if (account.otpExpiry && new Date() > account.otpExpiry) {
    throw new apiError(400, "OTP has expired. Please request a new one.");
  }

  // Verify OTP
  const isOTPValid = await verifyOTP(otp, account.otp);
  if (!isOTPValid) {
    throw new apiError(400, "Invalid OTP");
  }

  // Mark as verified and clear OTP
  account.isVerified = true;
  account.otp = undefined;
  account.otpExpiry = undefined;
  await account.save();

  // Exclude sensitive data
  const accountData = account.toObject();
  delete accountData.password;
  delete accountData.otp;
  if (accountData.refreshToken) delete accountData.refreshToken;

  return res
    .status(200)
    .json(new apiResponse(200, accountData, "Email verified successfully"));
});

/**
 * Resend OTP for all roles
 * POST /api/auth/resend-otp
 */
export const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new apiError(400, "Email is required");
  }

  // Try to find account in all role models
  const models = [
    { model: User, name: "User" },
    { model: Department, name: "Department" },
    { model: Academic, name: "Academic" },
    { model: HostelOffice, name: "HostelOffice" },
    { model: Gate, name: "Gate" },
  ];

  let account = null;

  for (const { model } of models) {
    account = await model.findOne({ email });
    if (account) break;
  }

  if (!account) {
    throw new apiError(404, "Account not found with this email");
  }

  if (account.isVerified) {
    return res
      .status(200)
      .json(new apiResponse(200, null, "Email already verified"));
  }

  // Generate new OTP
  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const otpExpiry = getOTPExpiry();

  account.otp = hashedOTP;
  account.otpExpiry = otpExpiry;
  await account.save();

  // Send OTP email
  const skipEmail = process.env.SKIP_EMAIL_VERIFICATION === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const accountName = account.name || account.departmentName || account.hostelName || account.gateName || account.rollNo || account.departmentId || account.academicId || account.officeId || account.gateId;
  
  if (skipEmail) {
    logOTPToConsole(email, otp, accountName);
  } else {
    try {
      await sendOTPEmail(email, otp, accountName);
    } catch (error) {
      // In development, log to console if SMTP not configured
      if (isDevelopment && (error.code === 'ENOCONFIG' || error.message.includes('SMTP credentials not configured'))) {
        logOTPToConsole(email, otp, accountName);
      } else {
        throw error;
      }
    }
  }

  return res
    .status(200)
    .json(new apiResponse(200, null, "OTP resent successfully. Please check your email."));
});


export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new apiError(400, "Email is required");
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(200)
      .json(new apiResponse(200, null, "If an account exists with this email, an OTP has been sent."));
  }

  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const otpExpiry = getOTPExpiry();

  user.otp = hashedOTP;
  user.otpExpiry = otpExpiry;
  await user.save();

  // Send OTP email
  const skipEmail = process.env.SKIP_EMAIL_VERIFICATION === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (skipEmail) {
    const { logOTPToConsole } = await import("../utils/email-dev-mode.js");
    logOTPToConsole(email, otp, user.name, "Password Reset");
  } else {
    try {
      // Use a password reset email template (can be enhanced)
      await sendOTPEmail(email, otp, user.name);
    } catch (error) {
      if (isDevelopment && (error.code === 'ENOCONFIG' || error.message.includes('SMTP credentials not configured'))) {
        const { logOTPToConsole } = await import("../utils/email-dev-mode.js");
        logOTPToConsole(email, otp, user.name, "Password Reset");
      } else {
        throw error;
      }
    }
  }

  return res
    .status(200)
    .json(new apiResponse(200, null, "If an account exists with this email, an OTP has been sent."));
});


export const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    throw new apiError(400, "Email, OTP, and new password are required");
  }

  if (newPassword.length < 6) {
    throw new apiError(400, "Password must be at least 6 characters long");
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new apiError(404, "User not found");
  }

  // Check if OTP exists
  if (!user.otp) {
    throw new apiError(400, "No OTP found. Please request a new one.");
  }

  // Check if OTP expired
  if (user.otpExpiry && new Date() > user.otpExpiry) {
    throw new apiError(400, "OTP has expired. Please request a new one.");
  }

  // Verify OTP
  const isOTPValid = await verifyOTP(otp, user.otp);
  if (!isOTPValid) {
    throw new apiError(400, "Invalid OTP");
  }

  // Reset password
  user.password = newPassword;
  user.otp = undefined;
  user.otpExpiry = undefined;
  await user.save();

  return res
    .status(200)
    .json(new apiResponse(200, null, "Password reset successfully"));
});

/**
 * Update Password (for authenticated users)
 * POST /api/auth/update-password
 */
export const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new apiError(400, "Current password and new password are required");
  }

  if (newPassword.length < 6) {
    throw new apiError(400, "New password must be at least 6 characters long");
  }

  // Get user from request (set by verifyJWT middleware)
  if (!req.user) {
    throw new apiError(401, "Unauthorized");
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new apiError(404, "User not found");
  }

  // Verify current password
  const isPasswordCorrect = await user.isPasswordCorrect(currentPassword);
  if (!isPasswordCorrect) {
    throw new apiError(401, "Current password is incorrect");
  }

  // Update password
  user.password = newPassword;
  await user.save();

  return res
    .status(200)
    .json(new apiResponse(200, null, "Password updated successfully"));
});
