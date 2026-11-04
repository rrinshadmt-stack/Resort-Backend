import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { AppError } from "../utils/errors";
import type { IDocumentMetadata } from "../models/verification.model";

// Private storage directory outside public web root
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "private_documents");

// Ensure private upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
];

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (_req, file, cb) => {
        const uniqueKey = crypto.randomBytes(16).toString("hex");
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `doc_${Date.now()}_${uniqueKey}${ext}`);
    },
});

export const privateUpload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB maximum
    },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new AppError(
                    "Only PDF, JPEG, PNG, and WEBP documents are allowed for verification",
                    400
                )
            );
        }
    },
});

export const fileToMetadata = (file: Express.Multer.File): IDocumentMetadata => {
    return {
        fileKey: path.basename(file.filename),
        originalName: file.originalname,
        filePath: file.path,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date(),
    };
};

export const getPrivateFilePath = (fileKey: string): string | null => {
    // Sanitize fileKey to avoid directory traversal
    const safeKey = path.basename(fileKey);
    const fullPath = path.join(UPLOAD_DIR, safeKey);
    if (fs.existsSync(fullPath)) {
        return fullPath;
    }
    return null;
};

