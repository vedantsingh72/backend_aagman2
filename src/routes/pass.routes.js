import { Router } from "express";
import {
  createPass,
  getMyPasses,
} from "../controllers/pass.controller.js";

import { validate } from "../middleware/validate.middleware.js";
import { createPassSchema } from "../schemas/pass.schema.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = Router();

// Student creates pass
router.post(
  "/",
  verifyJWT,
  allowRoles("user"),
  validate(createPassSchema),
  createPass
);

// Student views own passes
router.get(
  "/my",
  verifyJWT,
  allowRoles("user"),
  getMyPasses
);

export default router;
