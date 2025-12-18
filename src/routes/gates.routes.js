import { Router } from "express";
import { registerGate, scanGatePass } from "../controllers/gate.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { registerGateSchema } from "../schemas/gate.schema.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { allowRoles } from "../middleware/role.middleware.js";

const router = Router();

// POST /api/gate/register - Register a new gate
router.post("/register", validate(registerGateSchema), registerGate);

router.post(
  "/scan",
  verifyJWT,
  allowRoles("gate"),
  scanGatePass
);

export default router;
