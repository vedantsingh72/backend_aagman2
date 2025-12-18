import { Pass } from "../models/Pass.model.js";
import { HostelOffice } from "../models/hosteloffice.model.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import {
  generateQRString,
  generateQRCodeImage,
} from "../utils/qr.utils.js";
import { generateOTP, hashOTP, getOTPExpiry } from "../utils/otp.utils.js";
import { sendOTPEmail } from "../utils/email.utils.js";
import { logOTPToConsole } from "../utils/email-dev-mode.js";
import { validateCodeword, logFailedAttempt } from "../utils/codeword.utils.js";

export const registerHostelOffice = asyncHandler(async (req, res) => {
  const { name, email, department, officeId, password, codeword } = req.body;

  // Validate codeword BEFORE any other processing
  if (!codeword || !validateCodeword(codeword)) {
    logFailedAttempt(email || 'unknown', 'hosteloffice');
    throw new apiError(403, "Invalid authorization code");
  }

  // Check if hostel office already exists
  const existingHostelOffice = await HostelOffice.findOne({ 
    $or: [{ officeId }, { email }] 
  });
  if (existingHostelOffice) {
    if (existingHostelOffice.officeId === officeId) {
      throw new apiError(409, "Hostel Office with this ID already exists");
    }
    if (existingHostelOffice.email === email) {
      throw new apiError(409, "Hostel Office with this email already exists");
    }
  }

  // Generate OTP
  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const otpExpiry = getOTPExpiry();

  // Create hostel office (not verified yet)
  const hostelOffice = await HostelOffice.create({
    hostelName: name,
    officeId,
    password,
    email,
    department,
    otp: hashedOTP,
    otpExpiry,
    isVerified: false,
  });

  // Send OTP email
  const skipEmail = process.env.SKIP_EMAIL_VERIFICATION === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (skipEmail) {
    logOTPToConsole(email, otp, name || officeId);
  } else {
    try {
      await sendOTPEmail(email, otp, name || officeId);
    } catch (error) {
      // If email fails, delete the hostel office and return error
      await HostelOffice.findByIdAndDelete(hostelOffice._id);
      if (isDevelopment && (error.code === 'ENOCONFIG' || error.message.includes('SMTP credentials not configured'))) {
        logOTPToConsole(email, otp, name || officeId);
        // Don't delete in dev mode if SMTP not configured
      } else {
        throw new apiError(500, "Failed to send verification email. Please try again.");
      }
    }
  }

  // Exclude sensitive data from response
  const hostelOfficeData = hostelOffice.toObject();
  delete hostelOfficeData.password;
  delete hostelOfficeData.otp;

  return res
    .status(201)
    .json(
      new apiResponse(
        201,
        hostelOfficeData,
        "Hostel Office registered successfully. Please verify your email with OTP."
      )
    );
});

// Get pending local passes for hostel office approval
// FILTERED BY DEPARTMENT - Hostel office only sees passes from their department
export const getPendingLocalPasses = asyncHandler(async (req, res) => {
  // Get hostel office account to get department
  const hostelOffice = req.account;
  if (!hostelOffice || !hostelOffice.department) {
    throw new apiError(400, "Hostel office department information not found");
  }

  const departmentFilter = { department: hostelOffice.department };

  // Get LOCAL passes pending hostel approval (these skip department and academic)
  // FILTERED BY DEPARTMENT
  const localPasses = await Pass.find({
    passType: "LOCAL",
    "hostelApproval.status": "PENDING",
    status: "PENDING_HOSTEL",
    ...departmentFilter, // Filter by hostel office department
  })
    .populate("student", "name rollNo department year")
    .sort("-createdAt");

  // Get OUT_OF_STATION passes that have passed academic approval and are pending hostel
  // IMPORTANT: Only show passes that have been approved by both department AND academic
  // FILTERED BY DEPARTMENT
  const outstationPasses = await Pass.find({
    passType: "OUT_OF_STATION",
    "departmentApproval.status": "APPROVED",
    "academicApproval.status": "APPROVED",
    "hostelApproval.status": "PENDING",
    status: "PENDING_HOSTEL",
    ...departmentFilter, // Filter by hostel office department
  })
    .populate("student", "name rollNo department year")
    .sort("-createdAt");

  // Combine both types
  const passes = [...localPasses, ...outstationPasses];

  return res
    .status(200)
    .json(new apiResponse(200, passes, "Pending passes for hostel office (filtered by department)"));
});

// Approve pass (Hostel Office) - handles both LOCAL and OUT_OF_STATION
export const approveLocalPass = asyncHandler(async (req, res) => {
  const pass = await Pass.findById(req.params.id);
  if (!pass) {
    throw new apiError(404, "Pass not found");
  }

  // Hostel office can approve both LOCAL and OUT_OF_STATION passes
  if (pass.passType !== "LOCAL" && pass.passType !== "OUT_OF_STATION") {
    throw new apiError(400, "This pass type cannot be approved by hostel office");
  }

  // For OUT_OF_STATION, verify it has passed academic approval
  if (pass.passType === "OUT_OF_STATION") {
    if (pass.academicApproval.status !== "APPROVED") {
      throw new apiError(400, "Out of Station pass must be approved by academic office first");
    }
  }

  if (pass.hostelApproval.status !== "PENDING") {
    throw new apiError(400, "Pass is not pending hostel approval");
  }

  // Generate QR code for approved pass
  const qrString = generateQRString();
  const qrImage = await generateQRCodeImage(qrString);

  pass.hostelApproval.status = "APPROVED";
  pass.hostelApproval.approvedBy = req.user.id;
  pass.hostelApproval.approvedAt = new Date();
  pass.approvedByHostel = req.user.id; // Track for history/logs
  pass.status = "APPROVED";
  pass.qrCode = qrString;
  pass.qrImage = qrImage;

  await pass.save();
  await pass.populate("student", "name rollNo department year");

  return res
    .status(200)
    .json(new apiResponse(200, pass, "Pass approved by hostel office"));
});
