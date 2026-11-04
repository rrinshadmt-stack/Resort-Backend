import { Schema, model, Document, Types } from "mongoose";

export const CANCELLATION_STATUSES = [
    "pending",
    "approved",
    "rejected",
    "processed",
] as const;
export type CancellationStatus = (typeof CANCELLATION_STATUSES)[number];

export const REFUND_STATUSES = [
    "pending",
    "processed",
    "failed",
    "not_applicable",
] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export interface ICancellation extends Document {
    booking: Types.ObjectId;
    user: Types.ObjectId;
    reason: string;
    status: CancellationStatus;
    cancellationFee: number;
    refundAmount: number;
    refundStatus: RefundStatus;
    refundTransactionId?: string | null;
    refundProcessedAt?: Date | null;
    adminRemarks?: string | null;
    reviewedBy?: Types.ObjectId | null;
    reviewedAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const cancellationSchema = new Schema<ICancellation>(
    {
        booking: {
            type: Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            index: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: CANCELLATION_STATUSES,
            default: "pending",
            index: true,
        },
        cancellationFee: {
            type: Number,
            default: 0,
            min: 0,
        },
        refundAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        refundStatus: {
            type: String,
            enum: REFUND_STATUSES,
            default: "pending",
            index: true,
        },
        refundTransactionId: {
            type: String,
            trim: true,
            default: null,
        },
        refundProcessedAt: {
            type: Date,
            default: null,
        },
        adminRemarks: {
            type: String,
            trim: true,
            default: null,
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

export const Cancellation = model<ICancellation>("Cancellation", cancellationSchema);
export default Cancellation;

