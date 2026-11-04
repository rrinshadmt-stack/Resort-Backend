import { Schema, model, Document, Types } from "mongoose";

export const PAYMENT_METHODS = [
    "card",
    "upi",
    "netbanking",
    "wallet",
    "paypal",
    "stripe",
    "cash",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_TRANSACTION_STATUSES = [
    "pending",
    "completed",
    "failed",
    "refunded",
    "partially_refunded",
] as const;
export type PaymentTransactionStatus = (typeof PAYMENT_TRANSACTION_STATUSES)[number];

export interface IPayment extends Document {
    transactionId: string;
    booking: Types.ObjectId;
    user: Types.ObjectId;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    paymentGateway: string;
    orderId?: string | null;
    status: PaymentTransactionStatus;
    paidAt?: Date | null;
    refundedAmount: number;
    gatewayResponse?: Record<string, unknown> | null;
    failureReason?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
    {
        transactionId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            index: true,
        },
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
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            default: "USD",
            uppercase: true,
            trim: true,
        },
        paymentMethod: {
            type: String,
            enum: PAYMENT_METHODS,
            required: true,
        },
        paymentGateway: {
            type: String,
            required: true,
            default: "Stripe",
            trim: true,
        },
        orderId: {
            type: String,
            trim: true,
            default: null,
            index: true,
        },
        status: {
            type: String,
            enum: PAYMENT_TRANSACTION_STATUSES,
            default: "pending",
            index: true,
        },
        paidAt: {
            type: Date,
            default: null,
        },
        refundedAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        gatewayResponse: {
            type: Schema.Types.Mixed,
            default: null,
        },
        failureReason: {
            type: String,
            trim: true,
            default: null,
        },
    },
    { timestamps: true }
);

export const Payment = model<IPayment>("Payment", paymentSchema);
export default Payment;

