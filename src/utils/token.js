import jwt from "jsonwebtoken";
import apiError from "./apiError.js";

/**
 * Generate JWT Access Token
 * @param {Object} payload - { id, role }
 */
export const generateAccessToken = (payload) => {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new apiError(500, "ACCESS_TOKEN_SECRET not defined");
  }

  return jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
    }
  );
};
