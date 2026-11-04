import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../utils/errors";
import { getPrivateFilePath } from "../../../middleware/private-upload.middleware";
import {
    listBuildingOwners,
    getOwnerDossier,
    reviewStage,
    requestMissingDocument,
} from "./admin.service";
import type {
    ReviewStageInput,
    RequestMissingDocumentInput,
} from "./admin.validation";
import { Verification } from "../../../models/verification.model";

const getParamString = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
};

/**
 * List all registered building owners
 */
export const listOwnersHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await listBuildingOwners(req.query);
        res.status(200).json({
            success: true,
            count: result.data.length,
            total: result.total,
            page: result.page,
            pages: result.pages,
            data: result.data,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get complete verification dossier for a specific owner
 */
export const getOwnerDossierHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const ownerId = getParamString(req.params.ownerId);
        const dossier = await getOwnerDossier(ownerId);
        res.status(200).json({
            success: true,
            data: dossier,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Review an individual stage (user, company, or property)
 */
export const reviewStageHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const ownerId = getParamString(req.params.ownerId);
        const stage = getParamString(req.params.stage);

        if (stage !== "user" && stage !== "company" && stage !== "property") {
            throw new AppError(
                "Invalid stage. Stage must be 'user', 'company', or 'property'",
                400
            );
        }

        const verification = await reviewStage(
            req.user!.id,
            ownerId,
            stage,
            req.body as ReviewStageInput
        );

        res.status(200).json({
            success: true,
            message: `${stage.toUpperCase()} verification stage reviewed successfully`,
            data: {
                stage,
                stageStatus:
                    stage === "user"
                        ? verification.userVerification.status
                        : stage === "company"
                        ? verification.companyVerification.status
                        : verification.propertyVerification.status,
                overallStatus: verification.overallStatus,
                adminRemarks:
                    stage === "user"
                        ? verification.userVerification.adminRemarks
                        : stage === "company"
                        ? verification.companyVerification.adminRemarks
                        : verification.propertyVerification.adminRemarks,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Request missing documents from an owner
 */
export const requestMissingDocsHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const ownerId = getParamString(req.params.ownerId);
        const verification = await requestMissingDocument(
            req.user!.id,
            ownerId,
            req.body as RequestMissingDocumentInput
        );

        res.status(200).json({
            success: true,
            message: "Missing document request recorded successfully",
            data: {
                requestedMissingDocuments:
                    verification.requestedMissingDocuments,
                overallStatus: verification.overallStatus,
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Admin securely views/streams any sensitive verification document
 */
export const adminGetSecureDocHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const ownerId = getParamString(req.params.ownerId);
        const fileKey = getParamString(req.params.fileKey);

        // Verify document belongs to this owner's verification
        const verification = await Verification.findOne({ owner: ownerId });
        if (!verification) {
            throw new AppError("Verification dossier not found", 404);
        }

        const isOwnerDoc =
            verification.userVerification.idDocument?.fileKey === fileKey ||
            verification.companyVerification.registrationCertificate?.fileKey === fileKey ||
            verification.companyVerification.otherApprovals.some((d) => d.fileKey === fileKey) ||
            verification.propertyVerification.ownershipProof?.fileKey === fileKey ||
            verification.propertyVerification.operatingLicenses.some((d) => d.fileKey === fileKey);

        if (!isOwnerDoc) {
            throw new AppError("Document not found in this owner's dossier", 404);
        }

        const filePath = getPrivateFilePath(fileKey);
        if (!filePath) {
            throw new AppError("Document file not found on private storage", 404);
        }

        res.sendFile(filePath);
    } catch (error) {
        next(error);
    }
};
