import { z } from "zod";

export const registerAcademicSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  academicId: z.string().min(1, "Academic ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  designation: z.string().optional(),
  codeword: z.string().min(1, "Authorization code is required"),
});

