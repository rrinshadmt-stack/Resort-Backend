import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/errors";

export const errorMiddleware = (
    err: unknown,
    req: Request,
    res: Response,
    _next: NextFunction
): void => {
    let statusCode = 500;
    let message = "Internal Server Error";

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    } else if (err instanceof multer.MulterError) {
        statusCode = 400;
        message =
            err.code === "LIMIT_FILE_SIZE"
                ? "Each image must be 5MB or smaller"
                : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
                    ? "You can upload a maximum of 5 images"
                    : err.message;
    } else if (err instanceof jwt.TokenExpiredError) {
        statusCode = 401;
        message = "Token expired";
    } else if (err instanceof jwt.JsonWebTokenError) {
        statusCode = 401;
        message = "Invalid token";
    } else if (err instanceof mongoose.Error.CastError) {
        statusCode = 400;
        message = `Invalid ${err.path}`;
    } else if (err instanceof mongoose.Error.ValidationError) {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((e) => e.message)
            .join(", ");
    } else if (
        typeof err === "object" &&
        err !== null &&
        (err as { code?: number }).code === 11000
    ) {
        statusCode = 409;
        message = "Duplicate value: this record already exists";
    } else if (
        typeof err === "object" &&
        err !== null &&
        (err as { type?: string }).type === "entity.parse.failed"
    ) {
        statusCode = 400;
        message = "Malformed JSON body";
    }

    if (statusCode >= 500) {
        console.error("Backend Error:", err);
        console.error("Request:", req.method, req.originalUrl);
    }

    res.status(statusCode).json({ success: false, message });
};