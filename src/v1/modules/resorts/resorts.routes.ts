import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/role.middleware";
import { upload } from "../../../middleware/upload.middleware";
import { validate } from "../../../middleware/validate";
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
router.get("/mine", authenticate, authorize("OWNER"), getMyResorts);
router.get("/admin/all", authenticate, authorize("ADMIN"), adminGetResorts);

router.get("/:id", getResort);

// multer must run before validate so multipart fields are parsed into req.body
router.post(
  "/",
  authenticate,
  authorize("OWNER"),
  upload.array("images", 5),
  validate(createResortSchema),
  createResortHandler
);

router.put(
  "/:id",
  authenticate,
  authorize("OWNER", "ADMIN"),
  upload.array("images", 5),
  validate(updateResortSchema),
  updateResortHandler
);

router.patch(
  "/:id/status",
  authenticate,
  authorize("ADMIN"),
  validate(updateStatusSchema),
  updateStatusHandler
);

router.delete("/:id", authenticate, authorize("OWNER", "ADMIN"), deleteResortHandler);

export default router;