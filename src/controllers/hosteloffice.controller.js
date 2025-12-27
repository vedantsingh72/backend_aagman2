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
  const { name, email, officeId, password, codeword } = req.body;

  if (!codeword || !validateCodeword(codeword)) {
    logFailedAttempt(email || 'unknown', 'hosteloffice');
    throw new apiError(403, "Invalid authorization code");
  }

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

  const otp = generateOTP();
  const hashedOTP = await hashOTP(otp);
  const otpExpiry = getOTPExpiry();

  const hostelOffice = await HostelOffice.create({
    hostelName: name,
    officeId,
    password,
    email,
    otp: hashedOTP,
    otpExpiry,
    isVerified: false,
  });

  const skipEmail = process.env.SKIP_EMAIL_VERIFICATION === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (skipEmail) {
    logOTPToConsole(email, otp, name || officeId);
  } else {
    try {
      await sendOTPEmail(email, otp, name || officeId);
    } catch (error) {
      await HostelOffice.findByIdAndDelete(hostelOffice._id);
      if (isDevelopment && (error.code === 'ENOCONFIG' || error.message.includes('SMTP credentials not configured'))) {
        logOTPToConsole(email, otp, name || officeId);
      } else {
        throw new apiError(500, "Failed to send verification email. Please try again.");
      }
    }
  }

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

export const getPendingLocalPasses = asyncHandler(async (req, res) => {
  const localPasses = await Pass.find({
    passType: "LOCAL",
    "hostelApproval.status": "PENDING",
    status: "PENDING_HOSTEL",
  })
    .populate("student", "name rollNo department year hostel")
    .sort("-createdAt");

  const outstationPasses = await Pass.find({
    passType: "OUT_OF_STATION",
    "departmentApproval.status": "APPROVED",
    "academicApproval.status": "APPROVED",
    "hostelApproval.status": "PENDING",
    status: "PENDING_HOSTEL",
  })
    .populate("student", "name rollNo department year hostel")
    .sort("-createdAt");

  const passes = [...localPasses, ...outstationPasses];

  return res
    .status(200)
    .json(new apiResponse(200, passes, "Pending passes for hostel office"));
});

export const approveLocalPass = asyncHandler(async (req, res) => {
  const pass = await Pass.findById(req.params.id);
  if (!pass) {
    throw new apiError(404, "Pass not found");
  }

  if (pass.passType !== "LOCAL" && pass.passType !== "OUT_OF_STATION") {
    throw new apiError(400, "This pass type cannot be approved by hostel office");
  }

  if (pass.passType === "OUT_OF_STATION") {
    if (pass.academicApproval.status !== "APPROVED") {
      throw new apiError(400, "Out of Station pass must be approved by academic office first");
    }
  }

  if (pass.hostelApproval.status !== "PENDING") {
    throw new apiError(400, "Pass is not pending hostel approval");
  }

  const qrString = generateQRString();
  const qrImage = await generateQRCodeImage(qrString);

  pass.hostelApproval.status = "APPROVED";
  pass.hostelApproval.approvedBy = req.user.id;
  pass.hostelApproval.approvedAt = new Date();
  pass.approvedByHostel = req.user.id;
  pass.status = "APPROVED";
  pass.qrCode = qrString;
  pass.qrImage = qrImage;

  await pass.save();
  await pass.populate("student", "name rollNo department year hostel");

  return res
    .status(200)
    .json(new apiResponse(200, pass, "Pass approved by hostel office"));
});

export const getHostelHistory = asyncHandler(async (req, res) => {
  const passes = await Pass.find({
    passType: { $in: ["LOCAL", "OUT_OF_STATION"] },
  })
    .populate("student", "name rollNo department year hostel")
    .sort("-createdAt");

  return res
    .status(200)
    .json(new apiResponse(200, passes, "Complete pass history"));
});
