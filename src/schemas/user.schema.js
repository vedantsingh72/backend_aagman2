import { z } from "zod";
import { DEPARTMENTS } from "../constants/departments.js";

export const registerUserSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters"),

  rollNo: z
    .string()
    .min(3, "Roll number is required"),

  registrationNo: z
    .string()
    .min(3, "Registration number is required"),

  department: z
    .enum(DEPARTMENTS, {
      errorMap: () => ({ message: `Department must be one of: ${DEPARTMENTS.join(", ")}` }),
    }),

  year: z
    .string()
    .regex(/^[1-4]$/, "Year must be 1, 2, 3, or 4")
    .optional(),

  hostel: z
    .string()
    .min(1, "Hostel is required"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),

  email: z
    .string()
    .email("Invalid email address"),
});
