import { Router } from "express";
import {
  registerAcademic,
  getPendingAcademicPasses,
  getAcademicStudentLeaves,
  getDepartmentLeaveStatsController,
  approveAcademicPass,
} from "../controllers/academic.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerAcademicSchema } from "../schemas/academic.schema.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = Router();

// POST /api/academic/register - Register a new academic
router.post("/register", validate(registerAcademicSchema), registerAcademic);

// GET /api/academic/pending - Get pending passes for academic approval
router.get(
  "/pending",
  verifyJWT,
  allowRoles("academic"),
  getPendingAcademicPasses
);

// GET /api/academic/student-leaves - Get student-wise leave statistics
router.get(
  "/student-leaves",
  verifyJWT,
  allowRoles("academic"),
  getAcademicStudentLeaves
);

// GET /api/academic/department-leaves - Get department-wise leave statistics
router.get(
  "/department-leaves",
  verifyJWT,
  allowRoles("academic"),
  getDepartmentLeaveStatsController
);

router.patch(
  "/approve/:id",
  verifyJWT,
  allowRoles("academic"),
  approveAcademicPass
);

export default router;
