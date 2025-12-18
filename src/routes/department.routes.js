import { Router } from "express";
import {
  registerDepartment,
  getPendingOutstationPasses,
  getDepartmentStudentLeaves,
  approveOutstationPass,
} from "../controllers/department.controller.js";

import { validate } from "../middleware/validate.middleware.js";
import { registerDepartmentSchema } from "../schemas/department.schema.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { attachUser } from "../middleware/attachuser.middleware.js";

const router = Router();

// POST /api/department/register - Register a new department
router.post("/register", validate(registerDepartmentSchema), registerDepartment);

// View pending outstation passes
router.get(
  "/pending",
  verifyJWT,
  allowRoles("department"),
  attachUser,
  getPendingOutstationPasses
);

// Get student leave statistics
router.get(
  "/student-leaves",
  verifyJWT,
  allowRoles("department"),
  attachUser,
  getDepartmentStudentLeaves
);

// Approve outstation pass
router.patch(
  "/approve/:id",
  verifyJWT,
  allowRoles("department"),
  attachUser,
  approveOutstationPass
);

export default router;
