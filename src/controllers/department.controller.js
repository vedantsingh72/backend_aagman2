import { Pass } from "../models/Pass.model.js";
import { Department } from "../models/department.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getStudentLeaveStats } from "../services/leaveAnalytics.service.js";
import { generateOTP, hashOTP, getOTPExpiry } from "../utils/otp.utils.js";
import { sendOTPEmail } from "../utils/email.utils.js";
import { logOTPToConsole } from "../utils/email-dev-mode.js";
import { validateCodeword, logFailedAttempt } from "../utils/codeword.utils.js";

export const registerDepartment = asyncHandler(async (req, res) => {
  const { name, email, department, departmentId, password, codeword } = req.body;

  // Validate codeword BEFORE any other processing
  if (!codeword || !validateCodeword(codeword)) {
    logFailedAttempt(email || 'unknown', 'department');
    throw new apiError(403, "Invalid authorization code");
  }

  // Check if department already exists
  const existingDepartment = await Department.findOne({ 
    $or: [{ departmentId }, { email }] 
  });
  if (existingDepartment) {
    if (existingDepartment.departmentId === departmentId) {
      throw new apiError(409, "Department with this ID already exists");
    }
    if (existingDepartment.email === email) {
      throw new apiError(409, "Department with this email already exists");
    }
  }

  // Generate OTP
  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const otpExpiry = getOTPExpiry();

  // Create department (not verified yet)
  const departmentAccount = await Department.create({
    departmentName: department,
    departmentId,
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
    logOTPToConsole(email, otp, name || departmentId);
  } else {
    try {
      await sendOTPEmail(email, otp, name || departmentId);
    } catch (error) {
      // If email fails, delete the department and return error
      await Department.findByIdAndDelete(departmentAccount._id);
      if (isDevelopment && (error.code === 'ENOCONFIG' || error.message.includes('SMTP credentials not configured'))) {
        logOTPToConsole(email, otp, name || departmentId);
        // Don't delete in dev mode if SMTP not configured
      } else {
        throw new apiError(500, "Failed to send verification email. Please try again.");
      }
    }
  }

  // Exclude sensitive data from response
  const departmentData = departmentAccount.toObject();
  delete departmentData.password;
  delete departmentData.otp;

  return res
    .status(201)
    .json(
      new apiResponse(201, departmentData, "Department registered successfully. Please verify your email with OTP.")
    );
});

export const getPendingOutstationPasses = asyncHandler(async (req, res) => {
  // Get department from logged-in department account
  const department = req.account;
  if (!department || !department.departmentName) {
    throw new apiError(400, "Department information not found");
  }

  // Find passes that:
  // 1. Are OUT_OF_STATION type
  // 2. Match this department
  // 3. Are pending department approval
  const passes = await Pass.find({
    passType: "OUT_OF_STATION",
    department: department.departmentName, // Match department name
    "departmentApproval.status": "PENDING",
    status: "PENDING_DEPARTMENT",
  })
    .populate("student", "name rollNo department year")
    .sort("-createdAt");

  return res
    .status(200)
    .json(new apiResponse(200, passes, "Pending outstation passes"));
});

/**
 * Get student-wise leave statistics for department
 * Only returns students from the logged-in department
 */
export const getDepartmentStudentLeaves = asyncHandler(async (req, res) => {
  const department = req.account;
  if (!department || !department.departmentName) {
    throw new apiError(400, "Department information not found");
  }

  const stats = await getStudentLeaveStats({
    department: department.departmentName,
  });

  return res
    .status(200)
    .json(new apiResponse(200, stats, "Student leave statistics"));
});

export const approveOutstationPass = asyncHandler(async (req, res) => {
  const pass = await Pass.findById(req.params.id);
  if (!pass) {
    throw new apiError(404, "Pass not found");
  }

  if (pass.passType !== "OUT_OF_STATION") {
    throw new apiError(400, "This is not an outstation pass");
  }

  // Verify department matches
  const department = req.account;
  if (pass.department !== department.departmentName) {
    throw new apiError(403, "You can only approve passes from your department");
  }

  if (pass.departmentApproval.status !== "PENDING") {
    throw new apiError(400, "Pass is not pending department approval");
  }

  // Approve at department level
  pass.departmentApproval.status = "APPROVED";
  pass.departmentApproval.approvedBy = req.user.id;
  pass.departmentApproval.approvedAt = new Date();
  pass.approvedByDepartment = req.user.id; // Track for history/logs

  // Move to next step: Academic approval
  pass.status = "PENDING_ACADEMIC";

  await pass.save();
  await pass.populate("student", "name rollNo department year");

  return res
    .status(200)
    .json(new apiResponse(200, pass, "Outstation pass approved by department"));
});
