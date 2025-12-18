import { Pass } from "../models/Pass.model.js";
import { Academic } from "../models/academic.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getStudentLeaveStats, getDepartmentLeaveStats } from "../services/leaveAnalytics.service.js";
import { generateOTP, hashOTP, getOTPExpiry } from "../utils/otp.utils.js";
import { sendOTPEmail } from "../utils/email.utils.js";
import { logOTPToConsole } from "../utils/email-dev-mode.js";
import { validateCodeword, logFailedAttempt } from "../utils/codeword.utils.js";

export const registerAcademic = asyncHandler(async (req, res) => {
  const { name, email, academicId, password, designation, codeword } = req.body;

  // Validate codeword BEFORE any other processing
  if (!codeword || !validateCodeword(codeword)) {
    logFailedAttempt(email || 'unknown', 'academic');
    throw new apiError(403, "Invalid authorization code");
  }

  // Check if academic already exists
  const existingAcademic = await Academic.findOne({ 
    $or: [{ academicId }, { email }] 
  });
  if (existingAcademic) {
    if (existingAcademic.academicId === academicId) {
      throw new apiError(409, "Academic with this ID already exists");
    }
    if (existingAcademic.email === email) {
      throw new apiError(409, "Academic with this email already exists");
    }
  }

  // Generate OTP
  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const otpExpiry = getOTPExpiry();

  // Create academic (not verified yet)
  const academic = await Academic.create({
    name,
    email,
    academicId,
    password,
    designation,
    otp: hashedOTP,
    otpExpiry,
    isVerified: false,
  });

  // Send OTP email
  const skipEmail = process.env.SKIP_EMAIL_VERIFICATION === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (skipEmail) {
    logOTPToConsole(email, otp, name || academicId);
  } else {
    try {
      await sendOTPEmail(email, otp, name || academicId);
    } catch (error) {
      // If email fails, delete the academic and return error
      await Academic.findByIdAndDelete(academic._id);
      if (isDevelopment && (error.code === 'ENOCONFIG' || error.message.includes('SMTP credentials not configured'))) {
        logOTPToConsole(email, otp, name || academicId);
        // Don't delete in dev mode if SMTP not configured
      } else {
        throw new apiError(500, "Failed to send verification email. Please try again.");
      }
    }
  }

  // Exclude sensitive data from response
  const academicData = academic.toObject();
  delete academicData.password;
  delete academicData.otp;

  return res
    .status(201)
    .json(
      new apiResponse(201, academicData, "Academic registered successfully. Please verify your email with OTP.")
    );
});

export const getPendingAcademicPasses = asyncHandler(async (req, res) => {
  // Get OUT_OF_STATION passes that have passed department approval and are pending academic
  // IMPORTANT: Only show passes that have been approved by department
  const passes = await Pass.find({
    passType: "OUT_OF_STATION",
    "departmentApproval.status": "APPROVED",
    "academicApproval.status": "PENDING",
    status: "PENDING_ACADEMIC",
  })
    .populate("student", "name rollNo department year")
    .sort("-createdAt");

  return res
    .status(200)
    .json(new apiResponse(200, passes, "Pending passes for academic office"));
});

/**
 * Get student-wise leave statistics for academic office
 * Returns students from ALL departments
 */
export const getAcademicStudentLeaves = asyncHandler(async (req, res) => {
  const stats = await getStudentLeaveStats();
  return res
    .status(200)
    .json(new apiResponse(200, stats, "Student leave statistics"));
});

/**
 * Get department-wise leave statistics
 * Returns grouped data by department
 */
export const getDepartmentLeaveStatsController = asyncHandler(async (req, res) => {
  const stats = await getDepartmentLeaveStats();
  return res
    .status(200)
    .json(new apiResponse(200, stats, "Department-wise leave statistics"));
});

export const approveAcademicPass = asyncHandler(async (req, res) => {
  const pass = await Pass.findById(req.params.id);
  if (!pass) {
    throw new apiError(404, "Pass not found");
  }

  if (pass.passType !== "OUT_OF_STATION") {
    throw new apiError(400, "This endpoint is for Out of Station passes only");
  }

  if (pass.academicApproval.status !== "PENDING") {
    throw new apiError(400, "Pass is not pending academic approval");
  }

  if (pass.status !== "PENDING_ACADEMIC") {
    throw new apiError(400, "Pass must be approved by department first");
  }

  // Approve at academic level
  pass.academicApproval.status = "APPROVED";
  pass.academicApproval.approvedBy = req.user.id;
  pass.academicApproval.approvedAt = new Date();
  pass.approvedByAcademic = req.user.id; // Track for history/logs

  // Move to next step: Hostel Office approval
  pass.status = "PENDING_HOSTEL";

  await pass.save();
  await pass.populate("student", "name rollNo department year");

  return res
    .status(200)
    .json(new apiResponse(200, pass, "Approved by academic office"));
});
