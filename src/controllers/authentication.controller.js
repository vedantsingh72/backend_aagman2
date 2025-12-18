import { User } from "../models/user.model.js";
import { Department } from "../models/department.model.js";
import { Academic } from "../models/academic.model.js";
import { HostelOffice } from "../models/hosteloffice.model.js";
import { Gate } from "../models/gate.model.js";

import apiError from "../utils/apiError.js";
import apiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { generateAccessToken } from "../utils/token.js";

export const login = asyncHandler(async (req, res) => {
  const { role, identifier, password } = req.body;

  const roleModelMap = {
  user: { model: User, key: "rollNo" },
  department: { model: Department, key: "departmentId" },
  academic: { model: Academic, key: "academicId" },
  hosteloffice: { model: HostelOffice, key: "officeId" },
  gate: { model: Gate, key: "gateId" },
};


  const config = roleModelMap[role];
  if (!config) throw new apiError(400, "Invalid role");

  const account = await config.model.findOne({
    [config.key]: identifier,
  });

  if (!account) throw new apiError(404, "Account not found");

  // Check if email is verified for ALL roles
  if (account.isVerified === false) {
    throw new apiError(403, "Please verify your email before logging in. Check your email for OTP.");
  }

  const isPasswordCorrect = await account.isPasswordCorrect(password);
  if (!isPasswordCorrect) throw new apiError(401, "Invalid credentials");

  const token = generateAccessToken({
    id: account._id,
    role,
  });

  // Exclude password from response
  const accountData = account.toObject();
  delete accountData.password;

  return res.status(200).json(
    new apiResponse(
      200,
      { token, role, user: accountData },
      "Login successful"
    )
  );
});
