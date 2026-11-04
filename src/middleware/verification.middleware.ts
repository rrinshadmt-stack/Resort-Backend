import type { Request, Response, NextFunction } from "express";
import { Verification } from "../models/verification.model";
import { AppError } from "../utils/errors";

/**
 * Middleware that ensures a property owner has completed all three verification stages
 * and received admin approval before creating or publishing properties.
 */
export const requireApprovedVerification = async (
    req: Request,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        if (!req.user) {
            return next(new AppError("Authentication required", 401));
        }

        // Platform administrators bypass this check
        if (req.user.role === "admin") {
            return next();
        }

        const verification = await Verification.findOne({ owner: req.user.id });

        if (!verification) {
            return next(
                new AppError(
                    "You must submit and obtain Admin approval for all three verification stages (User, Company, Property) before publishing properties.",
                    403
                )
            );
        }

        const isUserApproved = verification.userVerification.status === "Approved";
        const isCompanyApproved = verification.companyVerification.status === "Approved";
        const isPropertyApproved = verification.propertyVerification.status === "Approved";

        if (!isUserApproved || !isCompanyApproved || !isPropertyApproved) {
            const pendingStages: string[] = [];
            if (!isUserApproved) pendingStages.push(`User Verification (${verification.userVerification.status})`);
            if (!isCompanyApproved) pendingStages.push(`Company Verification (${verification.companyVerification.status})`);
            if (!isPropertyApproved) pendingStages.push(`Property Verification (${verification.propertyVerification.status})`);

            return next(
                new AppError(
                    `You cannot publish properties until all 3 verification stages are Approved. Pending: ${pendingStages.join(", ")}`,
                    403
                )
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};
