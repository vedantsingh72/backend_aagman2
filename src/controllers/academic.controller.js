import { Pass } from "../models/Pass.model.js";
import { Academic } from "../models/academic.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { getStudentLeaveStats, getDepartmentLeaveStats } from "../services/leaveAnalytics.service.js";
import { PASS_TYPES } from "../constants/passTypes.js";
import { generateOTP, hashOTP, getOTPExpiry } from "../utils/otp.utils.js";
import { sendOTPEmail } from "../utils/email.utils.js";
import { logOTPToConsole } from "../utils/email-dev-mode.js";
import { validateCodeword, logFailedAttempt } from "../utils/codeword.utils.js";

export const registerAcademic = asyncHandler(async (req, res) => {
  const { name, email, academicId, password, designation, codeword } = req.body;

  if (!codeword || !validateCodeword(codeword)) {
    logFailedAttempt(email || 'unknown', 'academic');
    throw new apiError(403, "Invalid authorization code");
  }

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

  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const otpExpiry = getOTPExpiry();

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

  const skipEmail = process.env.SKIP_EMAIL_VERIFICATION === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (skipEmail) {
    logOTPToConsole(email, otp, name || academicId);
  } else {
    try {
      await sendOTPEmail(email, otp, name || academicId);
    } catch (error) {
      await Academic.findByIdAndDelete(academic._id);
      if (isDevelopment && (error.code === 'ENOCONFIG' || error.message.includes('SMTP credentials not configured'))) {
        logOTPToConsole(email, otp, name || academicId);
      } else {
        throw new apiError(500, "Failed to send verification email. Please try again.");
      }
    }
  }

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
  const passes = await Pass.find({
    passType: "OUT_OF_STATION",
    "departmentApproval.status": "APPROVED",
    "academicApproval.status": "PENDING",
    status: "PENDING_ACADEMIC",
  })
    .populate("student", "name rollNo department year hostel")
    .sort("-createdAt");

  return res
    .status(200)
    .json(new apiResponse(200, passes, "Pending passes for academic office"));
});

export const getAcademicStudentLeaves = asyncHandler(async (req, res) => {
  const stats = await getStudentLeaveStats({
    passTypeFilter: PASS_TYPES.OUT_OF_STATION,
  });
  return res
    .status(200)
    .json(new apiResponse(200, stats, "Student leave statistics"));
});
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
    throw new apiError(400, "Academic office can only approve OUT_OF_STATION passes");
  }

  if (pass.academicApproval.status !== "PENDING") {
    throw new apiError(400, "Pass is not pending academic approval");
  }

  if (pass.status !== "PENDING_ACADEMIC") {
    throw new apiError(400, "Pass must be approved by department first");
  }

  pass.academicApproval.status = "APPROVED";
  pass.academicApproval.approvedBy = req.user.id;
  pass.academicApproval.approvedAt = new Date();
  pass.approvedByAcademic = req.user.id;
  pass.status = "PENDING_HOSTEL";

  await pass.save();
  await pass.populate("student", "name rollNo department year hostel");

  return res
    .status(200)
    .json(new apiResponse(200, pass, "Approved by academic office"));
});

export const getAcademicHistory = asyncHandler(async (req, res) => {
  const passes = await Pass.find({
    passType: "OUT_OF_STATION",
  })
    .populate("student", "name rollNo department year hostel")
    .sort("-createdAt");

  return res
    .status(200)
    .json(new apiResponse(200, passes, "Academic outstation pass history"));
});
