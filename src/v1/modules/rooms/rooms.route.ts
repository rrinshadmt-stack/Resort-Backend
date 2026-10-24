import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/role.middleware";
import { upload } from "../../../middleware/upload.middleware";
import { validate } from "../../../middleware/validate";
import { createRoomSchema, updateRoomSchema } from "./rooms.validation";
import {
    getRooms,
    getRoom,
    createRoomHandler,
    updateRoomHandler,
    deleteRoomHandler,
} from "./rooms.controller";

const router = Router();

// Mounted at /api/v1
router.get("/resorts/:resortId/rooms", getRooms);
router.get("/rooms/:id", getRoom);

// multer must run before validate so multipart fields are parsed into req.body
router.post(
    "/resorts/:resortId/rooms",
    authenticate,
    authorize("OWNER", "ADMIN"),
    upload.array("images", 5),
    validate(createRoomSchema),
    createRoomHandler
);

router.put(
    "/rooms/:id",
    authenticate,
    authorize("OWNER", "ADMIN"),
    upload.array("images", 5),
    validate(updateRoomSchema),
    updateRoomHandler
);

router.delete(
    "/rooms/:id",
    authenticate,
    authorize("OWNER", "ADMIN"),
    deleteRoomHandler
);

export default router;