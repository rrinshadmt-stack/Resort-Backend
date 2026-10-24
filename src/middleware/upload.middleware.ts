import multer from "multer";
import { AppError } from "../utils/errors";
import { uploadBuffer, type UploadedImage } from "../utils/upload.utils";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Files stay in memory only. Nothing is sent to Cloudinary until the
// controller has validated the body and checked ownership.
export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 5 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true);
        cb(new AppError("Only JPEG, PNG and WEBP images are allowed", 400));
    },
});

export const uploadFiles = async (
    files: Express.Multer.File[] | undefined,
    folder: string
): Promise<UploadedImage[]> => {
    if (!files || files.length === 0) return [];
    return Promise.all(files.map((file) => uploadBuffer(file.buffer, folder)));
};