import { z } from "zod";

export const registerGateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  gateId: z.string().min(1, "Gate ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  codeword: z.string().min(1, "Authorization code is required"),
});

