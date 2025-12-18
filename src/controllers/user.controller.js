import { User } from "../models/user.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateOTP, hashOTP, getOTPExpiry } from "../utils/otp.utils.js";
import { sendOTPEmail } from "../utils/email.utils.js";
import { logOTPToConsole } from "../utils/email-dev-mode.js";

export const registerUser = asyncHandler(async (req, res) => {
  const { name, rollNo, registrationNo, department, year, hostel, password, email } =
    req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [{ rollNo }, { email }] 
  });
  if (existingUser) {
    if (existingUser.rollNo === rollNo) {
      throw new apiError(409, "User with this roll number already exists");
    }
    if (existingUser.email === email) {
      throw new apiError(409, "User with this email already exists");
    }
  }

  // Generate OTP
  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const otpExpiry = getOTPExpiry();

  // Create user (not verified yet)
  const user = await User.create({
    name,
    rollNo,
    registrationNo,
    department,
    year,
    hostel,
    password,
    email,
    otp: hashedOTP,
    otpExpiry,
    isVerified: false,
  });

  // Send OTP email
  const skipEmail = process.env.SKIP_EMAIL_VERIFICATION === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (skipEmail) {
    // Development mode: Log OTP to console instead of sending email
    logOTPToConsole(email, otp, name);
    // Mark user as verified for development
    user.isVerified = true;
    await user.save();
  } else {
    // Production mode: Send actual email
    try {
      await sendOTPEmail(email, otp, name);
    } catch (error) {
      // Log detailed error for debugging
      console.error('Email sending error:', {
        message: error.message,
        code: error.code,
        email: email,
        hasSMTPConfig: !!(process.env.SMTP_USER && process.env.SMTP_PASS),
      });

      // In development, allow registration without email if SMTP not configured
      if (isDevelopment && (error.code === 'ENOCONFIG' || error.message.includes('SMTP credentials not configured'))) {
        console.warn('⚠️  Development mode: SMTP not configured');
        console.warn('⚠️  Logging OTP to console instead of sending email');
        console.warn('⚠️  Set SKIP_EMAIL_VERIFICATION=true in .env to suppress this warning');
        
        // Log OTP to console for development
        logOTPToConsole(email, otp, name);
        
        // Mark user as verified for development
        user.isVerified = true;
        await user.save();
      } else {
        // Production or configured SMTP failed - delete user and return error
        await User.findByIdAndDelete(user._id);
        
        // Provide helpful error message based on error type
        let errorMessage = "Failed to send verification email. Please try again.";
        
        if (error.code === 'ENOCONFIG' || error.message.includes('SMTP credentials not configured')) {
          errorMessage = "Email service not configured. Please contact administrator or set SKIP_EMAIL_VERIFICATION=true for development.";
        } else if (error.code === 'EAUTH' || error.message.includes('authentication failed')) {
          errorMessage = "Email service authentication failed. Please check SMTP credentials in server configuration.";
        } else if (error.code === 'ECONNECTION' || error.message.includes('connection')) {
          errorMessage = "Could not connect to email service. Please check your network connection and try again later.";
        } else if (error.code === 'ETIMEDOUT') {
          errorMessage = "Email service connection timed out. Please try again later.";
        }
        
        throw new apiError(500, errorMessage);
      }
    }
  }

  // Exclude sensitive data from response
  const userData = user.toObject();
  delete userData.password;
  delete userData.otp;
  delete userData.refreshToken;

  // Customize message based on email mode
  let successMessage = "Registration successful. Please check your email for OTP verification.";
  if (skipEmail || (isDevelopment && user.isVerified)) {
    successMessage = "Registration successful. Account verified (development mode).";
  }

  return res
    .status(201)
    .json(new apiResponse(201, userData, successMessage));
});

export const getMyProfile = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new apiResponse(200, req.account, "Profile fetched"));
});
