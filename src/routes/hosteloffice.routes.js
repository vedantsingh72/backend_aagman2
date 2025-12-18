import { Router } from "express";
import {
  registerHostelOffice,
  getPendingLocalPasses,
  approveLocalPass,
} from "../controllers/hosteloffice.controller.js";

import { validate } from "../middleware/validate.middleware.js";
import { registerHostelOfficeSchema } from "../schemas/hosteloffice.schema.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = Router();

// POST /api/hosteloffice/register - Register a new hostel office
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

export default router;
