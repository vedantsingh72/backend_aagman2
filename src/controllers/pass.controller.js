import { Pass } from "../models/Pass.model.js";
import { User } from "../models/user.model.js";
import { PASS_TYPES } from "../constants/passTypes.js";
import { PASS_STATUS } from "../constants/status.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/* =====================================================
   STUDENT CONTROLLERS
===================================================== */

/**
 * Create a new gate pass (Student)
 * Pass types: OUT_OF_STATION, LOCAL, TEA_COFFEE
 * Department and year are auto-assigned from student profile
 */
export const createPass = asyncHandler(async (req, res) => {
  const { 
    passType, 
    reason, 
    reasonForLeave,
    fromDate, 
    toDate,
    // Out of Station specific fields
    placeWhereGoing,
    contactNumber,
    guardianContactNumber,
    addressDuringLeave,
    travelMode,
    emergencyContactName,
    emergencyContactRelation,
  } = req.body;

  // Validate passType
  const validPassTypes = Object.values(PASS_TYPES);
  if (!validPassTypes.includes(passType)) {
    throw new apiError(400, `Invalid passType. Must be one of: ${validPassTypes.join(", ")}`);
  }

  // Fetch student to get department and year
  const student = await User.findById(req.user.id);
  if (!student) {
    throw new apiError(404, "Student not found");
  }

  if (!student.department) {
    throw new apiError(400, "Student department is required. Please update your profile.");
  }

  // Determine initial status based on pass type
  // OUT_OF_STATION: Student → Department → Academic → Hostel → Gate
  // LOCAL: Student → Hostel → Gate
  // TEA_COFFEE: Student → Gate (direct, same day only)
  let initialStatus = PASS_STATUS.PENDING_DEPARTMENT;
  if (passType === PASS_TYPES.LOCAL) {
    initialStatus = PASS_STATUS.PENDING_HOSTEL; // Skip department and academic
  } else if (passType === PASS_TYPES.TEA_COFFEE) {
    // TEA_COFFEE goes directly to Gate (no approval needed, but gate must scan)
    // Status will be APPROVED but gate will scan it
    initialStatus = PASS_STATUS.APPROVED;
  }

  // Build pass data
  const passData = {
    student: req.user.id,
    passType,
    department: student.department, // Auto-assigned from student
    year: student.year, // Auto-assigned from student
    fromDate,
    toDate,
    status: initialStatus,
  };

  // Add reason (use reasonForLeave for OUT_OF_STATION, reason for others)
  if (passType === PASS_TYPES.OUT_OF_STATION) {
    passData.reasonForLeave = reasonForLeave || reason;
    passData.placeWhereGoing = placeWhereGoing;
    passData.contactNumber = contactNumber;
    passData.guardianContactNumber = guardianContactNumber;
    passData.addressDuringLeave = addressDuringLeave;
    if (travelMode) passData.travelMode = travelMode;
    if (emergencyContactName) passData.emergencyContactName = emergencyContactName;
    if (emergencyContactRelation) passData.emergencyContactRelation = emergencyContactRelation;
  } else {
    passData.reason = reason;
  }

  // Set approval status based on pass type
  if (passType === PASS_TYPES.OUT_OF_STATION) {
    // OUT_OF_STATION: Needs Department → Academic → Hostel approval
    passData.departmentApproval = { status: "PENDING" };
    passData.academicApproval = { status: "PENDING" };
    passData.hostelApproval = { status: "PENDING" };
  } else if (passType === PASS_TYPES.LOCAL) {
    // LOCAL: Only needs Hostel approval (skips Department and Academic)
    passData.hostelApproval = { status: "PENDING" };
    // Ensure department and academic are not required
    passData.departmentApproval = { status: "N/A" }; // Not applicable
    passData.academicApproval = { status: "N/A" }; // Not applicable
  } else if (passType === PASS_TYPES.TEA_COFFEE) {
    // TEA_COFFEE: Direct to Gate, no approvals needed
    // Generate QR code immediately for same-day use
    // Valid only for the same day - expires at midnight
    const { generateQRString, generateQRCodeImage } = await import("../utils/qr.utils.js");
    const qrString = generateQRString();
    const qrImage = await generateQRCodeImage(qrString);
    passData.qrCode = qrString;
    passData.qrImage = qrImage;
    // All approvals are N/A for TEA_COFFEE (bypass all approvals)
    passData.departmentApproval = { status: "N/A" };
    passData.academicApproval = { status: "N/A" };
    passData.hostelApproval = { status: "N/A" };
    // Set fromDate to start of today and toDate to end of today (midnight) for TEA_COFFEE
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    passData.fromDate = fromDate || startOfToday;
    passData.toDate = toDate || endOfToday;
  }

  const pass = await Pass.create(passData);

  // Populate student data in response
  await pass.populate("student", "name rollNo department year");

  return res
    .status(201)
    .json(new apiResponse(201, pass, "Pass created successfully"));
});

/**
 * Get logged-in student's passes
 */
export const getMyPasses = asyncHandler(async (req, res) => {
  const passes = await Pass.find({ student: req.user.id })
    .populate("student", "name rollNo")
    .sort("-createdAt");

  return res
    .status(200)
    .json(new apiResponse(200, passes, "Pass list fetched"));
});
