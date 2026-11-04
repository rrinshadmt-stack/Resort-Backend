import { Schema, model, type InferSchemaType } from "mongoose";

export const USER_ROLES = ["user", "property_owner", "admin"] as const;

export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            default: null,
        },
        role: {
            type: String,
            enum: USER_ROLES,
            default: "user",
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isPhoneVerified: {
            type: Boolean,
            default: false,
        },
        isBlock: {
            type: Boolean,
            default: false,
        },
        otpCode: {
            type: String,
            default: null,
        },
        otpExpiresAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof userSchema>;

export const User = model("User", userSchema);
export default User;
