import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/role.middleware";
import { upload } from "../../../middleware/upload.middleware";
import { validate } from "../../../middleware/validate";
import { requireApprovedVerification } from "../../../middleware/verification.middleware";
import {
  createResortSchema,
  updateResortSchema,
  updateStatusSchema,
} from "./resorts.validation";
import {
  getResorts,
  getResort,
  getMyResorts,
  adminGetResorts,
  createResortHandler,
  updateResortHandler,
  updateStatusHandler,
  deleteResortHandler,
} from "./resorts.controller";

const router = Router();

// Public
router.get("/", getResorts);

// Static paths must come before "/:id"
router.get("/mine", authenticate, authorize("property_owner"), getMyResorts);
router.get("/admin/all", authenticate, authorize("admin"), adminGetResorts);

router.get("/:id", getResort);

// multer must run before validate so multipart fields are parsed into req.body
// Property Owner must have all three verification stages approved to publish properties
router.post(
  "/",
  authenticate,
  authorize("property_owner"),
  requireApprovedVerification,
  upload.array("images", 5),
  validate(createResortSchema),
  createResortHandler
);

router.put(
  "/:id",
  authenticate,
  authorize("property_owner", "admin"),
  upload.array("images", 5),
  validate(updateResortSchema),
  updateResortHandler
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  validate(updateStatusSchema),
  updateStatusHandler
);

router.delete("/:id", authenticate, authorize("property_owner", "admin"), deleteResortHandler);

export default router;
