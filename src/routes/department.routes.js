import { Router } from "express";
import {
  registerDepartment,
  getPendingOutstationPasses,
  getDepartmentStudentLeaves,
  approveOutstationPass,
  getDepartmentHistory,
} from "../controllers/department.controller.js";

import { validate } from "../middleware/validate.middleware.js";
import { registerDepartmentSchema } from "../schemas/department.schema.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";
import { attachUser } from "../middleware/attachuser.middleware.js";

const router = Router();

router.post("/register", validate(registerDepartmentSchema), registerDepartment);

router.get(
  "/pending",
  verifyJWT,
  allowRoles("department"),
  attachUser,
  getPendingOutstationPasses
);

router.get(
  "/student-leaves",
  verifyJWT,
  allowRoles("department"),
  attachUser,
  getDepartmentStudentLeaves
);

router.patch(
  "/approve/:id",
  verifyJWT,
  allowRoles("department"),
  attachUser,
  approveOutstationPass
);

router.get(
  "/history",
  verifyJWT,
  allowRoles("department"),
  attachUser,
  getDepartmentHistory
);

export default router;
