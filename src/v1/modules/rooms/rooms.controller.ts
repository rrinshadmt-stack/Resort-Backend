import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Resort from "../../../models/resort.model";
import { AppError } from "../../../utils/errors";
import { deleteImages, type UploadedImage } from "../../../utils/upload.utils";
import { uploadFiles } from "../../../middleware/upload.middleware";
import type { CreateRoomInput, UpdateRoomInput } from "./rooms.validation";
import {
    getRoomsByResort,
    getRoomById,
    createRoom as createRoomService,
    updateRoom as updateRoomService,
    deleteRoom as deleteRoomService,
} from "./rooms.service";

const MAX_IMAGES_PER_ROOM = 10;

const assertValidId = (value: unknown, label: string): string => {
    if (typeof value !== "string" || !mongoose.isValidObjectId(value)) {
        throw new AppError(`Invalid ${label} ID`, 400);
    }
    return value;
};

// Owner of the resort, or an admin
const assertCanManage = async (
    resortId: unknown,
    user: Request["user"]
): Promise<void> => {
    const resort = await Resort.findById(resortId);
    if (!resort) throw new AppError("Resort not found", 404);

    const allowed =
        user?.role === "ADMIN" || resort.owner.toString() === user?.id;
    if (!allowed) throw new AppError("You do not own this resort", 403);
};

// Remove already-uploaded images if the request fails after upload
const discard = async (images: UploadedImage[]): Promise<void> => {
    if (images.length > 0) await deleteImages(images).catch(() => undefined);
};

export const getRooms = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const resortId = assertValidId(req.params.resortId, "resort");
        const rooms = await getRoomsByResort(resortId);
        res.status(200).json({ success: true, count: rooms.length, data: rooms });
    } catch (error) {
        next(error);
    }
};

export const getRoom = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = assertValidId(req.params.id, "room");
        const room = await getRoomById(id);
        if (!room) throw new AppError("Room not found", 404);
        res.status(200).json({ success: true, data: room });
    } catch (error) {
        next(error);
    }
};

export const createRoomHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    let images: UploadedImage[] = [];
    try {
        const resortId = assertValidId(req.params.resortId, "resort");
        await assertCanManage(resortId, req.user);

        images = await uploadFiles(
            req.files as Express.Multer.File[] | undefined,
            "stayup/rooms"
        );

        const room = await createRoomService(
            resortId,
            req.body as CreateRoomInput,
            images
        );
        res.status(201).json({ success: true, data: room });
    } catch (error) {
        await discard(images);
        next(error);
    }
};

export const updateRoomHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    let images: UploadedImage[] = [];
    try {
        const id = assertValidId(req.params.id, "room");

        const room = await getRoomById(id);
        if (!room) throw new AppError("Room not found", 404);
        await assertCanManage(room.resort, req.user);

        const incoming = (req.files as Express.Multer.File[] | undefined)?.length ?? 0;
        if (room.images.length + incoming > MAX_IMAGES_PER_ROOM) {
            throw new AppError(
                `A room can have at most ${MAX_IMAGES_PER_ROOM} images`,
                400
            );
        }

        images = await uploadFiles(
            req.files as Express.Multer.File[] | undefined,
            "stayup/rooms"
        );

        const updated = await updateRoomService(
            id,
            req.body as UpdateRoomInput,
            images
        );
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        await discard(images);
        next(error);
    }
};

export const deleteRoomHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const id = assertValidId(req.params.id, "room");

        const room = await getRoomById(id);
        if (!room) throw new AppError("Room not found", 404);
        await assertCanManage(room.resort, req.user);

        // TODO (bookings): once bookings exist, set isActive=false instead of deleting
        await deleteRoomService(id);
        await discard(room.images);

        res.status(200).json({ success: true, message: "Room deleted successfully" });
    } catch (error) {
        next(error);
    }
};