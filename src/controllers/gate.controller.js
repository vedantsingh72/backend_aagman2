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

  const pass = await Pass.findById(qrCode)
    .populate("student", "name rollNo department year hostel");

  if (!pass) {
    throw new apiError(404, "Invalid QR code");
  }

  const now = new Date();

  if (pass.passType === "OUT_OF_STATION") {
    if (
      pass.departmentApproval.status !== "APPROVED" ||
      pass.academicApproval.status !== "APPROVED" ||
      pass.hostelApproval.status !== "APPROVED"
    ) {
      throw new apiError(400, "Pass not fully approved.");
    }
  }

  if (pass.passType === "LOCAL" && pass.hostelApproval.status !== "APPROVED") {
    throw new apiError(400, "Pass not approved by hostel office");
  }

  if (pass.status === "EXPIRED" || pass.status === "CLOSED") {
    throw new apiError(400, "Pass already closed");
  }

  if (pass.toDate && new Date(pass.toDate) < now) {
    throw new apiError(400, "Pass has expired");
  }

  if (pass.fromDate && new Date(pass.fromDate) > now) {
    throw new apiError(400, "Pass not yet valid");
  }

  let scanType = "EXIT";

  if (!pass.scanCount || pass.scanCount === 0) {
    pass.scannedOutAt = new Date();
    pass.exitTime = new Date();
    pass.scanCount = 1;
  } else if (pass.scanCount === 1) {
    pass.scannedInAt = new Date();
    pass.entryTime = new Date();
    pass.scanCount = 2;
    pass.isUsed = true;
    pass.status = "CLOSED";
    scanType = "ENTRY";
  } else {
    throw new apiError(400, "Pass already closed");
  }

  await pass.save();

  const populatedPass = await Pass.findById(pass._id)
    .populate("student", "name rollNo department year hostel");

  // 🔥 THIS IS THE FIX — FLATTEN DATA
  return res.status(200).json(
    new apiResponse(200, {
      isUsed: populatedPass.isUsed,
      passType: populatedPass.passType,
      fromDate: populatedPass.fromDate,
      toDate: populatedPass.toDate,
      reason: populatedPass.reason,

      student: {
        name: populatedPass.student?.name,
        rollNo: populatedPass.student?.rollNo,
        department: populatedPass.student?.department,
        year: populatedPass.student?.year,
        hostel: populatedPass.student?.hostel
      },

      scanType,
      timestamp: new Date(),
      gateId: req.user.id
    }, "Scan successful")
  );
});
