import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import type { UserRole } from "../models/user.model";

export const authorize =
    (...roles: UserRole[]) =>
        (req: Request, _res: Response, next: NextFunction): void => {
            if (!req.user) {
                return next(new AppError("Authentication required", 401));
            }
            if (!roles.includes(req.user.role)) {
                return next(new AppError("You do not have permission to do this", 403));
            }
            next();
        };