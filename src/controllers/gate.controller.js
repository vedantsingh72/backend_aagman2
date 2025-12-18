import { Pass } from "../models/Pass.model.js";
import { Gate } from "../models/gate.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateOTP, hashOTP, getOTPExpiry } from "../utils/otp.utils.js";
import { sendOTPEmail } from "../utils/email.utils.js";
import { logOTPToConsole } from "../utils/email-dev-mode.js";
import { validateCodeword, logFailedAttempt } from "../utils/codeword.utils.js";


export const registerGate = asyncHandler(async (req, res) => {
  const { name, email, gateId, password, codeword } = req.body;

  // Validate codeword BEFORE any other processing
  if (!codeword || !validateCodeword(codeword)) {
    logFailedAttempt(email || 'unknown', 'gate');
    throw new apiError(403, "Invalid authorization code");
  }

  // Check if gate already exists
  const existingGate = await Gate.findOne({ 
    $or: [{ gateId }, { email }] 
  });
  if (existingGate) {
    if (existingGate.gateId === gateId) {
      throw new apiError(409, "Gate with this ID already exists");
    }
    if (existingGate.email === email) {
      throw new apiError(409, "Gate with this email already exists");
    }
  }

  // Generate OTP
  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const otpExpiry = getOTPExpiry();

  // Create gate (not verified yet)
  const gate = await Gate.create({
    gateName: name,
    gateId,
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
    logOTPToConsole(email, otp, name || gateId);
  } else {
    try {
      await sendOTPEmail(email, otp, name || gateId);
    } catch (error) {
      // If email fails, delete the gate and return error
      await Gate.findByIdAndDelete(gate._id);
      if (isDevelopment && (error.code === 'ENOCONFIG' || error.message.includes('SMTP credentials not configured'))) {
        logOTPToConsole(email, otp, name || gateId);
        // Don't delete in dev mode if SMTP not configured
      } else {
        throw new apiError(500, "Failed to send verification email. Please try again.");
      }
    }
  }

  // Exclude sensitive data from response
  const gateData = gate.toObject();
  delete gateData.password;
  delete gateData.otp;

  return res
    .status(201)
    .json(new apiResponse(201, gateData, "Gate registered successfully. Please verify your email with OTP."));
});

export const scanGatePass = asyncHandler(async (req, res) => {
  const { qrCode } = req.body;

  if (!qrCode) {
    throw new apiError(400, "QR code is required");
  }

  const pass = await Pass.findOne({ qrCode }).populate("student", "name rollNo");
  if (!pass) {
    throw new apiError(404, "Invalid QR code");
  }

  // Check if pass is approved based on pass type
  if (pass.passType === "OUT_OF_STATION") {
    // OUT_OF_STATION must be approved by Department, Academic, AND Hostel
    if (pass.departmentApproval.status !== "APPROVED" ||
        pass.academicApproval.status !== "APPROVED" ||
        pass.hostelApproval.status !== "APPROVED") {
      throw new apiError(400, "Pass not fully approved. Missing required approvals.");
    }
  } else if (pass.passType === "LOCAL") {
    // LOCAL only needs Hostel approval
    if (pass.hostelApproval.status !== "APPROVED") {
      throw new apiError(400, "Pass not approved by hostel office");
    }
  } else if (pass.passType === "TEA_COFFEE") {
    // TEA_COFFEE is auto-approved but check if it's still valid (same day)
    const today = new Date();
    const passDate = new Date(pass.fromDate);
    if (today.toDateString() !== passDate.toDateString()) {
      throw new apiError(400, "Tea/Coffee pass is only valid for the same day");
    }
  }

  // Check if pass is already expired/used
  if (pass.status === "EXPIRED" || pass.isUsed) {
    throw new apiError(400, "This pass has already been used and expired");
  }

  // QR Code scanning logic:
  // FIRST scan → EXIT (scannedOutAt)
  // SECOND scan → ENTRY (scannedInAt)
  // After ENTRY scan → pass EXPIRED
  // Third scan must FAIL with error

  const currentScanCount = pass.scanCount || 0;

  if (currentScanCount === 0) {
    // First scan - student exiting
    pass.scannedOutAt = new Date();
    pass.exitTime = new Date(); // Keep for backward compatibility
    pass.scanCount = 1;
    pass.scannedByGate = req.user.id; // Gate user ID
    await pass.save();
    
    return res
      .status(200)
      .json(new apiResponse(200, {
        pass,
        message: "Exit recorded successfully",
        scanType: "EXIT"
      }, "Exit recorded successfully"));
  } else if (currentScanCount === 1) {
    // Second scan - student entering, pass becomes EXPIRED
    pass.scannedInAt = new Date();
    pass.entryTime = new Date(); // Keep for backward compatibility
    pass.scanCount = 2;
    pass.isUsed = true;
    pass.status = "EXPIRED";
    await pass.save();
    
    return res
      .status(200)
      .json(new apiResponse(200, {
        pass,
        message: "Entry recorded. Pass expired.",
        scanType: "ENTRY"
      }, "Entry recorded. Pass expired."));
  } else {
    // Third scan or more - invalid
    throw new apiError(400, "Invalid scan. This pass has already been used and expired.");
  }
});
