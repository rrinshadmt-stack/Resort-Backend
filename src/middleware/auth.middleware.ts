import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../utils/errors";
import type { UserRole } from "../models/user.model";

export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return next(new AppError("Authentication required", 401));
    }

    try {
        const payload = verifyAccessToken(header.slice(7));
        req.user = { id: payload.userId, role: payload.role as UserRole };
        next();
    } catch {
        next(new AppError("Invalid or expired token", 401));
    }
};
