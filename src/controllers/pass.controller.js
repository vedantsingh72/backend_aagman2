import { Pass } from "../models/Pass.model.js";
import { User } from "../models/user.model.js";
import { PASS_TYPES } from "../constants/passTypes.js";
import { PASS_STATUS } from "../constants/status.js";
import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createPass = asyncHandler(async (req, res) => {
  const { 
    passType, 
    reason, 
    reasonForLeave,
    fromDate, 
    toDate,
    placeWhereGoing,
    contactNumber,
    guardianContactNumber,
    addressDuringLeave,
    travelMode,
    emergencyContactName,
    emergencyContactRelation,
  } = req.body;

  const validPassTypes = Object.values(PASS_TYPES);
  if (!validPassTypes.includes(passType)) {
    throw new apiError(400, `Invalid passType. Must be one of: ${validPassTypes.join(", ")}`);
  }

  const student = await User.findById(req.user.id);
  if (!student) {
    throw new apiError(404, "Student not found");
  }

  if (!student.department) {
    throw new apiError(400, "Student department is required. Please update your profile.");
  }

  let initialStatus = PASS_STATUS.PENDING_DEPARTMENT;
  if (passType === PASS_TYPES.LOCAL) {
    initialStatus = PASS_STATUS.PENDING_HOSTEL;
  } else if (passType === PASS_TYPES.TEA_COFFEE) {
    initialStatus = PASS_STATUS.APPROVED;
  }

  const passData = {
    student: req.user.id,
    passType,
    department: student.department,
    year: student.year,
    hostel: student.hostel,
    fromDate,
    toDate,
    status: initialStatus,
  };

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

  if (passType === PASS_TYPES.OUT_OF_STATION) {
    passData.departmentApproval = { status: "PENDING" };
    passData.academicApproval = { status: "PENDING" };
    passData.hostelApproval = { status: "PENDING" };
  } else if (passType === PASS_TYPES.LOCAL) {
    passData.hostelApproval = { status: "PENDING" };
    passData.departmentApproval = { status: "N/A" };
    passData.academicApproval = { status: "N/A" };
  } else if (passType === PASS_TYPES.TEA_COFFEE) {
    const { generateQRString, generateQRCodeImage } = await import("../utils/qr.utils.js");
    const qrString = generateQRString();
    const qrImage = await generateQRCodeImage(qrString);
    passData.qrCode = qrString;
    passData.qrImage = qrImage;
    passData.departmentApproval = { status: "N/A" };
    passData.academicApproval = { status: "N/A" };
    passData.hostelApproval = { status: "N/A" };
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    passData.fromDate = fromDate || startOfToday;
    passData.toDate = toDate || endOfToday;
  }

  const pass = await Pass.create(passData);

  await pass.populate("student", "name rollNo department year");

  return res
    .status(201)
    .json(new apiResponse(201, pass, "Pass created successfully"));
});

export const getMyPasses = asyncHandler(async (req, res) => {
  const passes = await Pass.find({ student: req.user.id })
    .populate("student", "name rollNo")
    .sort("-createdAt");

  return res
    .status(200)
    .json(new apiResponse(200, passes, "Pass list fetched"));
});
