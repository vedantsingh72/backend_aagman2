import { z } from "zod";

export const loginSchema = z.object({
  role: z.enum([
    "user",
    "department",
    "academic",
    "hosteloffice",
    "gate",
  ]),
  identifier: z
    .string()
    .min(3, "Identifier is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
});

export const verifyOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resendOTPSchema = z.object({
  email: z.string().email("Invalid email address"),
});