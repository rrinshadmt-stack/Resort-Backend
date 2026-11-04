import type { Request, Response, NextFunction } from "express";
import { AppError } from "../../../utils/errors";
import {
    fileToMetadata,
    getPrivateFilePath,
} from "../../../middleware/private-upload.middleware";
import {
    upsertOwnerProfile,
    getOwnerProfile,
    getOwnerVerificationDetails,
    submitStep1UserVerification,
    submitStep2CompanyVerification,
    submitStep3PropertyVerification,
} from "./owner.service";
import type {
    OwnerProfileInput,
    Step1UserVerificationInput,
    Step2CompanyVerificationInput,
    Step3PropertyVerificationInput,
} from "./owner.validation";
import { Verification } from "../../../models/verification.model";

const getParamString = (param: string | string[] | undefined): string => {
    if (Array.isArray(param)) return param[0] || "";
    return param || "";
};

/**
 * Get Owner Profile
 */
export const getProfileHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const profile = await getOwnerProfile(req.user!.id);
        res.status(200).json({
            success: true,
            data: profile,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create or Update Owner Profile
 */
export const upsertProfileHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const profile = await upsertOwnerProfile(
            req.user!.id,
            req.body as OwnerProfileInput
        );
        res.status(200).json({
            success: true,
            message: "Owner profile saved successfully",
            data: profile,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get Owner Verification Status and Details
 */
export const getVerificationStatusHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const verification = await getOwnerVerificationDetails(req.user!.id);
        res.status(200).json({
            success: true,
            data: {
                overallStatus: verification.overallStatus,
                userVerification: verification.userVerification,
                companyVerification: verification.companyVerification,
                propertyVerification: verification.propertyVerification,
                adminRemarks: verification.adminRemarks,
                requestedMissingDocuments: verification.requestedMissingDocuments,
                canPublishProperties: verification.overallStatus === "Approved",
            },
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Step 1: Submit User Verification with ID Document
 */
export const submitStep1Handler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const singleFile = req.file;

        let idDocFile: Express.Multer.File | undefined = singleFile;
        if (!idDocFile && files?.["idDocument"]?.[0]) {
            idDocFile = files["idDocument"][0];
        }

        const idDocumentMeta = idDocFile ? fileToMetadata(idDocFile) : undefined;

        const verification = await submitStep1UserVerification(
            req.user!.id,
            req.body as Step1UserVerificationInput,
            idDocumentMeta
        );

        res.status(200).json({
            success: true,
            message: "User verification details and document submitted successfully",
            data: verification.userVerification,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Step 2: Submit Company Verification with Certificate & Approvals
 */
export const submitStep2Handler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const files = req.files as
            | { [fieldname: string]: Express.Multer.File[] }
            | undefined;

        const certFile = files?.["registrationCertificate"]?.[0] || req.file;
        const certMeta = certFile ? fileToMetadata(certFile) : undefined;

        const otherApprovalFiles = files?.["otherApprovals"] || [];
        const otherApprovalsMeta = otherApprovalFiles.map(fileToMetadata);

        const verification = await submitStep2CompanyVerification(
            req.user!.id,
            req.body as Step2CompanyVerificationInput,
            certMeta,
            otherApprovalsMeta
        );

        res.status(200).json({
            success: true,
            message: "Company verification details and documents submitted successfully",
            data: verification.companyVerification,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Step 3: Submit Property Verification with Proof of Ownership & Operating Licenses
 */
export const submitStep3Handler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const files = req.files as
            | { [fieldname: string]: Express.Multer.File[] }
            | undefined;

        const ownershipFile = files?.["ownershipProof"]?.[0] || req.file;
        const ownershipMeta = ownershipFile ? fileToMetadata(ownershipFile) : undefined;

        const operatingLicenseFiles = files?.["operatingLicenses"] || [];
        const operatingLicensesMeta = operatingLicenseFiles.map(fileToMetadata);

        const verification = await submitStep3PropertyVerification(
            req.user!.id,
            req.body as Step3PropertyVerificationInput,
            ownershipMeta,
            operatingLicensesMeta
        );

        res.status(200).json({
            success: true,
            message: "Property verification details and documents submitted successfully",
            data: verification.propertyVerification,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Securely stream an uploaded verification document to the owner.
 * Ensures the document belongs to this owner and was never publicly exposed.
 */
export const getSecureDocumentHandler = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const fileKey = getParamString(req.params.fileKey);
        const ownerId = req.user!.id;

        // Verify that this file belongs to this owner
        const verification = await Verification.findOne({ owner: ownerId });
        if (!verification) {
            throw new AppError("Verification record not found", 404);
        }

        const isOwnerDoc =
            verification.userVerification.idDocument?.fileKey === fileKey ||
            verification.companyVerification.registrationCertificate?.fileKey === fileKey ||
            verification.companyVerification.otherApprovals.some((d) => d.fileKey === fileKey) ||
            verification.propertyVerification.ownershipProof?.fileKey === fileKey ||
            verification.propertyVerification.operatingLicenses.some((d) => d.fileKey === fileKey);

        if (!isOwnerDoc) {
            throw new AppError("You do not have access to this document", 403);
        }

        const filePath = getPrivateFilePath(fileKey);
        if (!filePath) {
            throw new AppError("File not found on private storage", 404);
        }

        res.sendFile(filePath);
    } catch (error) {
        next(error);
    }
};
