import { Schema, model, Document, Types } from "mongoose";

export interface IOwnerProfile extends Document {
    user: Types.ObjectId;
    businessName: string;
    businessType: string;
    businessRegistrationNumber: string;
    gstNumber?: string;
    businessAddress: {
        street?: string;
        city: string;
        state?: string;
        postalCode?: string;
        country: string;
    };
    contactNumber: string;
    createdAt: Date;
    updatedAt: Date;
}

const ownerProfileSchema = new Schema<IOwnerProfile>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },
        businessName: {
            type: String,
            required: true,
            trim: true,
        },
        businessType: {
            type: String,
            required: true,
            trim: true,
        },
        businessRegistrationNumber: {
            type: String,
            required: true,
            trim: true,
        },
        gstNumber: {
            type: String,
            trim: true,
            default: null,
        },
        businessAddress: {
            street: { type: String, trim: true },
            city: { type: String, required: true, trim: true },
            state: { type: String, trim: true },
            postalCode: { type: String, trim: true },
            country: { type: String, required: true, trim: true },
        },
        contactNumber: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

export const OwnerProfile = model<IOwnerProfile>("OwnerProfile", ownerProfileSchema);
export default OwnerProfile;

