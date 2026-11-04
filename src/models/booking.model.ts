import { Schema, model, Document, Types } from "mongoose";

export const BOOKING_STATUSES = [
    "pending",
    "confirmed",
    "completed",
    "cancelled",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = [
    "pending",
    "paid",
    "partially_refunded",
    "refunded",
    "failed",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface IBooking extends Document {
    bookingReference: string;
    user: Types.ObjectId;
    property: Types.ObjectId;
    resort: Types.ObjectId;
    room: Types.ObjectId;
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    guestCount: number;
    roomCount: number;
    checkIn: Date;
    checkOut: Date;
    nights: number;
    pricePerNight: number;
    subtotal: number;
    taxesAndFees: number;
    discount: number;
    totalAmount: number;
    currency: string;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    specialRequests?: string;
    cancellationReason?: string;
    cancelledAt?: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
    {
        bookingReference: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
            index: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        property: {
            type: Schema.Types.ObjectId,
            ref: "Resort",
            required: true,
            index: true,
        },
        resort: {
            type: Schema.Types.ObjectId,
            ref: "Resort",
            required: true,
            index: true,
        },
        room: {
            type: Schema.Types.ObjectId,
            ref: "Room",
            required: true,
            index: true,
        },
        guestName: {
            type: String,
            required: true,
            trim: true,
        },
        guestEmail: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        guestPhone: {
            type: String,
            required: true,
            trim: true,
        },
        guestCount: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        roomCount: {
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        checkIn: {
            type: Date,
            required: true,
        },
        checkOut: {
            type: Date,
            required: true,
        },
        nights: {
            type: Number,
            required: true,
            min: 1,
        },
        pricePerNight: {
            type: Number,
            required: true,
            min: 0,
        },
        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },
        taxesAndFees: {
            type: Number,
            default: 0,
            min: 0,
        },
        discount: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalAmount: {
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
        status: {
            type: String,
            enum: BOOKING_STATUSES,
            default: "pending",
            index: true,
        },
        paymentStatus: {
            type: String,
            enum: PAYMENT_STATUSES,
            default: "pending",
            index: true,
        },
        specialRequests: {
            type: String,
            trim: true,
            default: null,
        },
        cancellationReason: {
            type: String,
            trim: true,
            default: null,
        },
        cancelledAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Pre-save hook: ensure property and resort point to the same ObjectId
bookingSchema.pre("validate", function (this: IBooking) {
    if (!this.property && this.resort) {
        this.property = this.resort;
    } else if (!this.resort && this.property) {
        this.resort = this.property;
    }
});

export const Booking = model<IBooking>("Booking", bookingSchema);
export default Booking;

