import { Types } from "mongoose";
import { User } from "../../../models/user.model";
import { OwnerProfile } from "../../../models/owner-profile.model";
import {
    Verification,
    type IVerification,
    type StageStatus,
} from "../../../models/verification.model";
import { AppError } from "../../../utils/errors";
import { recalculateOverallStatus } from "../owner/owner.service";
import type {
    ReviewStageInput,
    RequestMissingDocumentInput,
} from "./admin.validation";

export interface ListOwnersQuery {
    page?: number;
    limit?: number;
    status?: StageStatus;
    search?: string;
}

/**
 * List all registered building owners with their profiles & verification statuses
 */
export const listBuildingOwners = async (query: ListOwnersQuery) => {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const userFilter: Record<string, unknown> = {
        role: "property_owner",
    };

    if (query.search) {
        const regex = new RegExp(query.search.trim(), "i");
        userFilter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
    }

    const owners = await User.find(userFilter)
        .select("-passwordHash -otpCode -otpExpiresAt")
        .sort({ createdAt: -1 })
        .lean();

    const ownerIds = owners.map((o) => o._id);

    // Fetch matching profiles and verifications
    const [profiles, verifications] = await Promise.all([
        OwnerProfile.find({ user: { $in: ownerIds } }).lean(),
        Verification.find({ owner: { $in: ownerIds } }).lean(),
    ]);

    const profileMap = new Map(profiles.map((p) => [p.user.toString(), p]));
    const verificationMap = new Map(verifications.map((v) => [v.owner.toString(), v]));

    let combined = owners.map((owner) => {
        const ownerIdStr = owner._id.toString();
        const verification = verificationMap.get(ownerIdStr);
        return {
            owner: {
                id: ownerIdStr,
                name: owner.name,
                email: owner.email,
                phone: owner.phone,
                role: owner.role,
                isVerified: owner.isVerified,
                createdAt: owner.createdAt,
            },
            profile: profileMap.get(ownerIdStr) || null,
            verification: verification
                ? {
                      id: verification._id,
                      overallStatus: verification.overallStatus,
                      userStatus: verification.userVerification.status,
                      companyStatus: verification.companyVerification.status,
                      propertyStatus: verification.propertyVerification.status,
                      requestedMissingDocuments:
                          verification.requestedMissingDocuments,
                      createdAt: verification.createdAt,
                      updatedAt: verification.updatedAt,
                  }
                : {
                      overallStatus: "Pending",
                      userStatus: "Pending",
                      companyStatus: "Pending",
                      propertyStatus: "Pending",
                      requestedMissingDocuments: [],
                  },
        };
    });

    if (query.status) {
        combined = combined.filter(
            (item) => item.verification.overallStatus === query.status
        );
    }

    const total = combined.length;
    const paginatedData = combined.slice(skip, skip + limit);

    return {
        data: paginatedData,
        total,
        page,
        pages: Math.ceil(total / limit),
    };
};

/**
 * Get full dossier for a specific owner
 */
export const getOwnerDossier = async (ownerId: string) => {
    const user = await User.findById(ownerId).select("-passwordHash -otpCode -otpExpiresAt");
    if (!user) throw new AppError("Owner not found", 404);

    const [profile, verification] = await Promise.all([
        OwnerProfile.findOne({ user: ownerId }),
        Verification.findOne({ owner: ownerId })
            .populate("userVerification.reviewedBy", "name email")
            .populate("companyVerification.reviewedBy", "name email")
            .populate("propertyVerification.reviewedBy", "name email")
            .populate("verifiedBy", "name email"),
    ]);

    return {
        owner: user,
        profile,
        verification,
    };
};

/**
 * Review an individual verification stage (user, company, or property)
 */
export const reviewStage = async (
    adminId: string,
    ownerId: string,
    stage: "user" | "company" | "property",
    input: ReviewStageInput
): Promise<IVerification> => {
    const verification = await Verification.findOne({ owner: ownerId });
    if (!verification) {
        throw new AppError("Verification dossier not found for this owner", 404);
    }

    const adminObjectId = new Types.ObjectId(adminId);
    const now = new Date();

    if (stage === "user") {
        verification.userVerification.status = input.status;
        if (input.remarks !== undefined) {
            verification.userVerification.adminRemarks = input.remarks;
        }
        verification.userVerification.reviewedBy = adminObjectId;
        verification.userVerification.reviewedAt = now;
    } else if (stage === "company") {
        verification.companyVerification.status = input.status;
        if (input.remarks !== undefined) {
            verification.companyVerification.adminRemarks = input.remarks;
        }
        verification.companyVerification.reviewedBy = adminObjectId;
        verification.companyVerification.reviewedAt = now;
    } else if (stage === "property") {
        verification.propertyVerification.status = input.status;
        if (input.remarks !== undefined) {
            verification.propertyVerification.adminRemarks = input.remarks;
        }
        verification.propertyVerification.reviewedBy = adminObjectId;
        verification.propertyVerification.reviewedAt = now;
    } else {
        throw new AppError("Invalid stage: must be 'user', 'company', or 'property'", 400);
    }

    // Recalculate overall status based on the stages
    const newOverall = recalculateOverallStatus(verification);
    verification.overallStatus = newOverall;

    if (newOverall === "Approved") {
        verification.verifiedBy = adminObjectId;
        verification.verifiedAt = now;
    }

    await verification.save();
    return verification;
};

/**
 * Request missing documents from owner
 */
export const requestMissingDocument = async (
    _adminId: string,
    ownerId: string,
    input: RequestMissingDocumentInput
): Promise<IVerification> => {
    const verification = await Verification.findOne({ owner: ownerId });
    if (!verification) {
        throw new AppError("Verification dossier not found for this owner", 404);
    }

    verification.requestedMissingDocuments.push({
        documentName: input.documentName,
        instructions: input.instructions,
        stage: input.stage,
        requestedAt: new Date(),
        resolved: false,
    });

    // Mark the stage as Under Review or Pending until missing document is supplied
    if (input.stage === "user") {
        verification.userVerification.status = "Under Review";
    } else if (input.stage === "company") {
        verification.companyVerification.status = "Under Review";
    } else if (input.stage === "property") {
        verification.propertyVerification.status = "Under Review";
    }

    verification.overallStatus = recalculateOverallStatus(verification);
    await verification.save();
    return verification;
};

