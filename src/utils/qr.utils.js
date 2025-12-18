import crypto from "crypto";
import QRCode from "qrcode";
import apiError from "./apiError.js";

/**
 * Generate unique QR string (stored in DB)
 */
export const generateQRString = () => {
  return crypto.randomBytes(16).toString("hex");
};

/**
 * Generate QR Code image (Base64)
 * @param {string} data - QR string
 */
export const generateQRCodeImage = async (data) => {
  try {
    return await QRCode.toDataURL(data);
  } catch (error) {
    throw new apiError(500, "Failed to generate QR code");
  }
};
