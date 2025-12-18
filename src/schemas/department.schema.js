import { z } from "zod";
import { DEPARTMENTS } from "../constants/departments.js";

export const registerDepartmentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  department: z.enum(DEPARTMENTS, {
    errorMap: () => ({ message: `Department must be one of: ${DEPARTMENTS.join(", ")}` }),
  }),
  departmentId: z.string().min(1, "Department ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  codeword: z.string().min(1, "Authorization code is required"),
});

