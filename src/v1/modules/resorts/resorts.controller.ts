import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AppError } from "../../../utils/errors";
import { deleteImages, type UploadedImage } from "../../../utils/upload.utils";
import { uploadFiles } from "../../../middleware/upload.middleware";
import {
  listResortsQuerySchema,
  adminListResortsQuerySchema,
  type CreateResortInput,
  type UpdateResortInput,
} from "./resorts.validation";
import {
  listResorts,
  getResortById,
  createResort as createResortService,
  updateResort as updateResortService,
  setResortStatus,
  deleteResortCascade,
} from "./resorts.service";
import type { ResortStatus } from "../../../models/resort.model";

const MAX_IMAGES_PER_RESORT = 10;

const assertValidId = (value: unknown, label = "resort"): string => {
  if (typeof value !== "string" || !mongoose.isValidObjectId(value)) {
    throw new AppError(`Invalid ${label} ID`, 400);
  }
  return value;
};

const discard = async (images: UploadedImage[]): Promise<void> => {
  if (images.length > 0) await deleteImages(images).catch(() => undefined);
};

const parseQuery = <T>(
  schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false; error: { issues: { message: string }[] } } },
  query: unknown
): T => {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new AppError(result.error.issues[0]?.message ?? "Invalid query", 400);
  }
  return result.data;
};

const sendPage = (
  res: Response,
  result: { data: unknown[]; total: number; page: number; pages: number }
): void => {
  res.status(200).json({
    success: true,
    count: result.data.length,
    total: result.total,
    page: result.page,
    pages: result.pages,
    data: result.data,
  });
};

// Public: approved resorts only
export const getResorts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = parseQuery(listResortsQuerySchema, req.query);
    sendPage(res, await listResorts({ ...query, status: "APPROVED" }));
  } catch (error) {
    next(error);
  }
};

// Public: single approved resort
export const getResort = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const resort = await getResortById(assertValidId(req.params.id));
    if (!resort || resort.status !== "APPROVED") {
      throw new AppError("Resort not found", 404);
    }
    res.status(200).json({ success: true, data: resort });
  } catch (error) {
    next(error);
  }
};

// OWNER: own resorts, any status
export const getMyResorts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = parseQuery(adminListResortsQuerySchema, req.query);
    sendPage(res, await listResorts({ ...query, owner: req.user!.id }));
  } catch (error) {
    next(error);
  }
};

// ADMIN: all resorts, optional ?status=PENDING
export const adminGetResorts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = parseQuery(adminListResortsQuerySchema, req.query);
    sendPage(res, await listResorts(query));
  } catch (error) {
    next(error);
  }
};

// OWNER: create (starts as PENDING)
export const createResortHandler = async (req: Request, res: Response, next: NextFunction) => {
  let images: UploadedImage[] = [];
  try {
    images = await uploadFiles(
      req.files as Express.Multer.File[] | undefined,
      "stayup/resorts"
    );
    const resort = await createResortService(
      req.user!.id,
      req.body as CreateResortInput,
      images
    );
    res.status(201).json({ success: true, data: resort });
  } catch (error) {
    await discard(images);
    next(error);
  }
};

// OWNER (own) or ADMIN
export const updateResortHandler = async (req: Request, res: Response, next: NextFunction) => {
  let images: UploadedImage[] = [];
  try {
    const id = assertValidId(req.params.id);
    const resort = await getResortById(id);
    if (!resort) throw new AppError("Resort not found", 404);

    if (req.user!.role !== "ADMIN" && resort.owner.toString() !== req.user!.id) {
      throw new AppError("You do not own this resort", 403);
    }

    const incoming = (req.files as Express.Multer.File[] | undefined)?.length ?? 0;
    if (resort.images.length + incoming > MAX_IMAGES_PER_RESORT) {
      throw new AppError(
        `A resort can have at most ${MAX_IMAGES_PER_RESORT} images`,
        400
      );
    }

    images = await uploadFiles(
      req.files as Express.Multer.File[] | undefined,
      "stayup/resorts"
    );
    const updated = await updateResortService(id, req.body as UpdateResortInput, images);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    await discard(images);
    next(error);
  }
};

// ADMIN: approve / reject / suspend
export const updateStatusHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = assertValidId(req.params.id);
    const updated = await setResortStatus(id, req.body.status as ResortStatus);
    if (!updated) throw new AppError("Resort not found", 404);
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// OWNER (own) or ADMIN
export const deleteResortHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = assertValidId(req.params.id);
    const resort = await getResortById(id);
    if (!resort) throw new AppError("Resort not found", 404);

    if (req.user!.role !== "ADMIN" && resort.owner.toString() !== req.user!.id) {
      throw new AppError("You do not own this resort", 403);
    }

    const images = await deleteResortCascade(resort);
    await discard(images);
    res.status(200).json({ success: true, message: "Resort deleted successfully" });
  } catch (error) {
    next(error);
  }
};