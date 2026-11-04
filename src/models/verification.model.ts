import { Schema, model, Document, Types } from "mongoose";

export const STAGE_STATUSES = [
    "Pending",
    "Under Review",
    "Approved",
    "Rejected",
] as const;

export type StageStatus = (typeof STAGE_STATUSES)[number];

export interface IDocumentMetadata {
    fileKey: string;
    originalName: string;
    filePath: string;
    mimeType: string;
    size: number;
    uploadedAt: Date;
}

export interface IRequestedDocument {
    documentName: string;
    instructions: string;
    stage: "user" | "company" | "property";
    requestedAt: Date;
    resolved: boolean;
}

export interface IVerification extends Document {
    owner: Types.ObjectId;
    overallStatus: StageStatus;

    // Stage 1: User Verification
    userVerification: {
        status: StageStatus;
        email?: string;
        phone?: string;
        isEmailVerified: boolean;
        isPhoneVerified: boolean;
        idType?: string;
        idNumber?: string;
        fullName?: string;
        idDocument?: IDocumentMetadata;
        adminRemarks?: string;
        reviewedBy?: Types.ObjectId;
        reviewedAt?: Date;
    };

    // Stage 2: Company Verification
    companyVerification: {
        status: StageStatus;
        businessName?: string;
        businessType?: string;
        businessRegistrationNumber?: string;
        gstNumber?: string;
        registrationCertificate?: IDocumentMetadata;
        otherApprovals: IDocumentMetadata[];
        adminRemarks?: string;
        reviewedBy?: Types.ObjectId;
        reviewedAt?: Date;
    };

    // Stage 3: Property Verification
    propertyVerification: {
        status: StageStatus;
        propertyName?: string;
        propertyType?: string;
        propertyAddress?: string;
        city?: string;
        googleMapsLocation?: {
            lat?: number;
            lng?: number;
            mapUrl?: string;
        };
        propertyImages: { url: string; publicId: string }[];
        ownershipProof?: IDocumentMetadata;
        operatingLicenses: IDocumentMetadata[];
        adminRemarks?: string;
        reviewedBy?: Types.ObjectId;
        reviewedAt?: Date;
    };

    adminRemarks?: string;
    requestedMissingDocuments: IRequestedDocument[];
    verifiedBy?: Types.ObjectId;
    verifiedAt?: Date;

    createdAt: Date;
    updatedAt: Date;
}

const documentMetadataSchema = new Schema<IDocumentMetadata>(
    {
        fileKey: { type: String, required: true },
        originalName: { type: String, required: true },
        filePath: { type: String, required: true },
        mimeType: { type: String, required: true },
        size: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const requestedDocumentSchema = new Schema<IRequestedDocument>(
    {
        documentName: { type: String, required: true },
        instructions: { type: String, required: true },
        stage: {
            type: String,
            enum: ["user", "company", "property"],
            required: true,
        },
        requestedAt: { type: Date, default: Date.now },
        resolved: { type: Boolean, default: false },
    },
    { _id: true }
);

const verificationSchema = new Schema<IVerification>(
    {
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        overallStatus: {
            type: String,
            enum: STAGE_STATUSES,
            default: "Pending",
            index: true,
        },

        // Step 1: User Verification
        userVerification: {
            status: {
                type: String,
                enum: STAGE_STATUSES,
                default: "Pending",
            },
            email: { type: String, trim: true },
            phone: { type: String, trim: true },
            isEmailVerified: { type: Boolean, default: false },
            isPhoneVerified: { type: Boolean, default: false },
            idType: { type: String, trim: true },
            idNumber: { type: String, trim: true },
            fullName: { type: String, trim: true },
            idDocument: { type: documentMetadataSchema, default: null },
            adminRemarks: { type: String, default: null },
            reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
            reviewedAt: { type: Date, default: null },
        },

        // Step 2: Company Verification
        companyVerification: {
            status: {
                type: String,
                enum: STAGE_STATUSES,
                default: "Pending",
            },
            businessName: { type: String, trim: true },
            businessType: { type: String, trim: true },
            businessRegistrationNumber: { type: String, trim: true },
            gstNumber: { type: String, trim: true, default: null },
            registrationCertificate: {
                type: documentMetadataSchema,
                default: null,
            },
            otherApprovals: {
                type: [documentMetadataSchema],
                default: [],
            },
            adminRemarks: { type: String, default: null },
            reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
            reviewedAt: { type: Date, default: null },
        },

        // Step 3: Property Verification
        propertyVerification: {
            status: {
                type: String,
                enum: STAGE_STATUSES,
                default: "Pending",
            },
            propertyName: { type: String, trim: true },
            propertyType: {
                type: String,
                enum: ["resort", "villa", "apartment", "building", ""],
                default: "resort",
            },
            propertyAddress: { type: String, trim: true },
            city: { type: String, trim: true },
            googleMapsLocation: {
                lat: { type: Number, default: null },
                lng: { type: Number, default: null },
                mapUrl: { type: String, default: null },
            },
            propertyImages: [
                {
                    url: { type: String, required: true },
                    publicId: { type: String, required: true },
                    _id: false,
                },
            ],
            ownershipProof: {
                type: documentMetadataSchema,
                default: null,
            },
            operatingLicenses: {
                type: [documentMetadataSchema],
                default: [],
            },
            adminRemarks: { type: String, default: null },
            reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
            reviewedAt: { type: Date, default: null },
        },

        adminRemarks: { type: String, default: null },
        requestedMissingDocuments: {
            type: [requestedDocumentSchema],
            default: [],
        },
        verifiedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
        verifiedAt: { type: Date, default: null },
    },
    { timestamps: true }
);

export const Verification = model<IVerification>(
    "Verification",
    verificationSchema
);

export default Verification;

