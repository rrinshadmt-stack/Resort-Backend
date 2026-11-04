import { Types } from "mongoose";
import { OwnerProfile, type IOwnerProfile } from "../../../models/owner-profile.model";
import {
    Verification,
    type IVerification,
    type IDocumentMetadata,
    type StageStatus,
} from "../../../models/verification.model";
import { User } from "../../../models/user.model";
import { AppError } from "../../../utils/errors";
import type {
    OwnerProfileInput,
    Step1UserVerificationInput,
    Step2CompanyVerificationInput,
    Step3PropertyVerificationInput,
} from "./owner.validation";

/**
 * Calculates the overall verification status based on the three stages.
 */
export const recalculateOverallStatus = (verification: IVerification): StageStatus => {
    const s1 = verification.userVerification.status;
    const s2 = verification.companyVerification.status;
    const s3 = verification.propertyVerification.status;

    if (s1 === "Approved" && s2 === "Approved" && s3 === "Approved") {
        return "Approved";
    }

    if (s1 === "Rejected" || s2 === "Rejected" || s3 === "Rejected") {
        return "Rejected";
    }

    if (
        s1 === "Under Review" ||
        s2 === "Under Review" ||
        s3 === "Under Review"
    ) {
        return "Under Review";
    }

    return "Pending";
};

/**
 * Retrieves existing verification dossier for an owner or creates a fresh one.
 */
export const getOrCreateVerification = async (ownerId: string): Promise<IVerification> => {
    let verification = await Verification.findOne({ owner: ownerId });

    if (!verification) {
        const user = await User.findById(ownerId);
        verification = await Verification.create({
            owner: new Types.ObjectId(ownerId),
            overallStatus: "Pending",
            userVerification: {
                status: "Pending",
                email: user?.email || "",
                phone: user?.phone || "",
                isEmailVerified: user?.isVerified || false,
                isPhoneVerified: Boolean(user?.phone),
            },
            companyVerification: {
                status: "Pending",
                otherApprovals: [],
            },
            propertyVerification: {
                status: "Pending",
                propertyImages: [],
                operatingLicenses: [],
            },
            requestedMissingDocuments: [],
        });
    }

    return verification;
};

/**
 * Creates or updates the Owner Profile.
 */
export const upsertOwnerProfile = async (
    userId: string,
    input: OwnerProfileInput
): Promise<IOwnerProfile> => {
    const profile = await OwnerProfile.findOneAndUpdate(
        { user: userId },
        {
            $set: {
                businessName: input.businessName,
                businessType: input.businessType,
                businessRegistrationNumber: input.businessRegistrationNumber,
                gstNumber: input.gstNumber || null,
                businessAddress: input.businessAddress,
                contactNumber: input.contactNumber,
            },
            $setOnInsert: { user: userId },
        },
        { new: true, upsert: true, runValidators: true }
    );

    // Also update company details in verification draft if pending
    const verification = await getOrCreateVerification(userId);
    if (
        verification.companyVerification.status === "Pending" ||
        verification.companyVerification.status === "Rejected"
    ) {
        verification.companyVerification.businessName = input.businessName;
        verification.companyVerification.businessType = input.businessType;
        verification.companyVerification.businessRegistrationNumber =
            input.businessRegistrationNumber;
        verification.companyVerification.gstNumber = input.gstNumber || undefined;
        await verification.save();
    }

    return profile;
};

/**
 * Gets owner profile for the authenticated user.
 */
export const getOwnerProfile = async (userId: string): Promise<IOwnerProfile | null> => {
    return await OwnerProfile.findOne({ user: userId });
};

/**
 * Step 1: Submit User Verification
 */
export const submitStep1UserVerification = async (
    ownerId: string,
    input: Step1UserVerificationInput,
    idDocument?: IDocumentMetadata
): Promise<IVerification> => {
    const user = await User.findById(ownerId);
    if (!user) throw new AppError("Owner user not found", 404);

    const verification = await getOrCreateVerification(ownerId);

    // Update phone on user if provided
    if (input.phone && !user.phone) {
        user.phone = input.phone;
        await user.save();
    }

    verification.userVerification.fullName = input.fullName;
    verification.userVerification.idType = input.idType;
    verification.userVerification.idNumber = input.idNumber;
    verification.userVerification.email = user.email;
    verification.userVerification.phone = input.phone || user.phone || "";
    verification.userVerification.isEmailVerified = user.isVerified;
    verification.userVerification.isPhoneVerified = Boolean(
        input.phone || user.phone
    );

    if (idDocument) {
        verification.userVerification.idDocument = idDocument;
    }

    if (!verification.userVerification.idDocument) {
        throw new AppError(
            "A government-issued identity document is required to complete Step 1",
            400
        );
    }

    // Move stage to Under Review for Admin
    verification.userVerification.status = "Under Review";
    verification.overallStatus = recalculateOverallStatus(verification);

    // Mark resolved in requested missing documents if any
    verification.requestedMissingDocuments.forEach((doc) => {
        if (doc.stage === "user") doc.resolved = true;
    });

    await verification.save();
    return verification;
};

/**
 * Step 2: Submit Company Verification
 */
export const submitStep2CompanyVerification = async (
    ownerId: string,
    input: Step2CompanyVerificationInput,
    registrationCertificate?: IDocumentMetadata,
    otherApprovals: IDocumentMetadata[] = []
): Promise<IVerification> => {
    const verification = await getOrCreateVerification(ownerId);

    verification.companyVerification.businessName = input.businessName;
    verification.companyVerification.businessType = input.businessType;
    verification.companyVerification.businessRegistrationNumber =
        input.businessRegistrationNumber;
    verification.companyVerification.gstNumber = input.gstNumber || undefined;

    if (registrationCertificate) {
        verification.companyVerification.registrationCertificate =
            registrationCertificate;
    }

    if (otherApprovals.length > 0) {
        verification.companyVerification.otherApprovals.push(...otherApprovals);
    }

    if (!verification.companyVerification.registrationCertificate) {
        throw new AppError(
            "A business registration certificate is required to complete Step 2",
            400
        );
    }

    // Update or create owner profile with company details
    await OwnerProfile.findOneAndUpdate(
        { user: ownerId },
        {
            $set: {
                businessName: input.businessName,
                businessType: input.businessType,
                businessRegistrationNumber: input.businessRegistrationNumber,
                gstNumber: input.gstNumber || null,
            },
            $setOnInsert: {
                user: ownerId,
                contactNumber: verification.userVerification.phone || "N/A",
                businessAddress: { city: "N/A", country: "N/A" },
            },
        },
        { upsert: true }
    );

    verification.companyVerification.status = "Under Review";
    verification.overallStatus = recalculateOverallStatus(verification);

    verification.requestedMissingDocuments.forEach((doc) => {
        if (doc.stage === "company") doc.resolved = true;
    });

    await verification.save();
    return verification;
};

/**
 * Step 3: Submit Property Verification
 */
export const submitStep3PropertyVerification = async (
    ownerId: string,
    input: Step3PropertyVerificationInput,
    ownershipProof?: IDocumentMetadata,
    operatingLicenses: IDocumentMetadata[] = [],
    propertyImages: { url: string; publicId: string }[] = []
): Promise<IVerification> => {
    const verification = await getOrCreateVerification(ownerId);

    verification.propertyVerification.propertyName = input.propertyName;
    verification.propertyVerification.propertyType = input.propertyType;
    verification.propertyVerification.propertyAddress = input.propertyAddress;
    verification.propertyVerification.city = input.city || "";

    if (input.lat !== undefined && input.lng !== undefined) {
        verification.propertyVerification.googleMapsLocation = {
            lat: input.lat,
            lng: input.lng,
            mapUrl:
                input.mapUrl ||
                `https://www.google.com/maps?q=${input.lat},${input.lng}`,
        };
    } else if (input.mapUrl) {
        verification.propertyVerification.googleMapsLocation = {
            mapUrl: input.mapUrl,
        };
    }

    if (ownershipProof) {
        verification.propertyVerification.ownershipProof = ownershipProof;
    }

    if (operatingLicenses.length > 0) {
        verification.propertyVerification.operatingLicenses.push(
            ...operatingLicenses
        );
    }

    if (propertyImages.length > 0) {
        verification.propertyVerification.propertyImages.push(...propertyImages);
    }

    if (!verification.propertyVerification.ownershipProof) {
        throw new AppError(
            "Proof of ownership or management agreement document is required for Step 3",
            400
        );
    }

    verification.propertyVerification.status = "Under Review";
    verification.overallStatus = recalculateOverallStatus(verification);

    verification.requestedMissingDocuments.forEach((doc) => {
        if (doc.stage === "property") doc.resolved = true;
    });

    await verification.save();
    return verification;
};

/**
 * Get current verification dossier & stages status for owner.
 */
export const getOwnerVerificationDetails = async (
    ownerId: string
): Promise<IVerification> => {
    return await getOrCreateVerification(ownerId);
};

