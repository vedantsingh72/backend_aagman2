import { Router } from "express";
import {
  registerHostelOffice,
  getPendingLocalPasses,
  approveLocalPass,
  rejectLocalPass,
  getHostelHistory,
  getStudentsCurrentlyOut,
  getStudentsCurrentlyInside,
} from "../controllers/hosteloffice.controller.js";

import { validate } from "../middleware/validate.middleware.js";
import { registerHostelOfficeSchema } from "../schemas/hosteloffice.schema.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = Router();

router.post(
  "/register",
  validate(registerHostelOfficeSchema),
  registerHostelOffice
);

router.get(
  "/pending",
  verifyJWT,
  allowRoles("hosteloffice"),
  getPendingLocalPasses
);

router.patch(
  "/approve/:id",
  verifyJWT,
  allowRoles("hosteloffice"),
  approveLocalPass
);

router.patch(
  "/reject/:id",
  verifyJWT,
  allowRoles("hosteloffice"),
  rejectLocalPass
);

router.get(
  "/history",
  verifyJWT,
  allowRoles("hosteloffice"),
  getHostelHistory
);

router.get(
  "/students-out",
  verifyJWT,
  allowRoles("hosteloffice"),
  getStudentsCurrentlyOut
);

router.get(
  "/students-inside",
  verifyJWT,
  allowRoles("hosteloffice"),
  getStudentsCurrentlyInside
);

export default router;
