import { z } from "zod";
import { DEPARTMENTS } from "../constants/departments.js";

export const registerHostelOfficeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  department: z.enum(DEPARTMENTS, {
    errorMap: () => ({ message: `Department must be one of: ${DEPARTMENTS.join(", ")}` }),
  }),
  officeId: z.string().min(1, "Office ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  codeword: z.string().min(1, "Authorization code is required"),
});

