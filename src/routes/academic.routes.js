import { Router } from "express";
import {
  registerAcademic,
  getPendingAcademicPasses,
  getAcademicStudentLeaves,
  getDepartmentLeaveStatsController,
  approveAcademicPass,
  getAcademicHistory,
} from "../controllers/academic.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerAcademicSchema } from "../schemas/academic.schema.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = Router();

router.post("/register", validate(registerAcademicSchema), registerAcademic);

router.get(
  "/pending",
  verifyJWT,
  allowRoles("academic"),
  getPendingAcademicPasses
);

router.get(
  "/student-leaves",
  verifyJWT,
  allowRoles("academic"),
  getAcademicStudentLeaves
);

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

router.get(
  "/history",
  verifyJWT,
  allowRoles("academic"),
  getAcademicHistory
);

export default router;
