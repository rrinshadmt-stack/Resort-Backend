import { Schema, model, Document, Types } from "mongoose";

export const NOTIFICATION_TYPES = [
    "BOOKING",
    "PAYMENT",
    "CANCELLATION",
    "VERIFICATION",
    "REVIEW",
    "SYSTEM",
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface INotification extends Document {
    user: Types.ObjectId;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    data?: Record<string, unknown>;
    isRead: boolean;
    readAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: NOTIFICATION_TYPES,
            default: "SYSTEM",
            index: true,
        },
        link: {
            type: String,
            trim: true,
            default: null,
        },
        data: {
            type: Schema.Types.Mixed,
            default: null,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

export const Notification = model<INotification>("Notification", notificationSchema);
export default Notification;

