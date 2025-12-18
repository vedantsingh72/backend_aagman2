import { User } from "../models/user.model.js";
import { Department } from "../models/department.model.js";
import { Academic } from "../models/academic.model.js";
import { HostelOffice } from "../models/hosteloffice.model.js";
import { Gate } from "../models/gate.model.js";
import apiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// Attach user account to request object based on role
// Fetches full user/entity data from database
export const attachUser = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new apiError(401, "Unauthorized");
  }

  const roleModelMap = {
    user: User,
    department: Department,
    academic: Academic,
    hosteloffice: HostelOffice,
    gate: Gate,
  };

  const Model = roleModelMap[req.user.role];
  if (!Model) {
    throw new apiError(400, "Invalid role");
  }

  const entity = await Model.findById(req.user.id).select("-password");
  if (!entity) {
    throw new apiError(404, "Account not found");
  }

  req.account = entity;
  next();
});
