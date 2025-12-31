import QRCode from "qrcode";
import apiError from "./apiError.js";

export const generateQRString = (passId) => {
  return passId.toString();
};

export const generateQRCodeImage = async (data) => {
  try {
    return await QRCode.toDataURL(data);
  } catch (error) {
    throw new apiError(500, "Failed to generate QR code");
  }
};
