import { Schema, model, Document, Types } from "mongoose";

export const REVIEW_STATUSES = [
    "pending",
    "approved",
    "flagged",
    "rejected",
] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface IReview extends Document {
    user: Types.ObjectId;
    property: Types.ObjectId;
    resort: Types.ObjectId;
    booking?: Types.ObjectId;
    rating: number;
    title?: string;
    comment: string;
    status: ReviewStatus;
    ownerReply?: {
        text: string;
        date: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
    {
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
        booking: {
            type: Schema.Types.ObjectId,
            ref: "Booking",
            default: null,
            index: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        title: {
            type: String,
            trim: true,
            default: null,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
        },
        status: {
            type: String,
            enum: REVIEW_STATUSES,
            default: "approved",
            index: true,
        },
        ownerReply: {
            text: { type: String, trim: true },
            date: { type: Date, default: null },
        },
    },
    { timestamps: true }
);

// Pre-validate hook: keep property & resort in sync
reviewSchema.pre("validate", function (this: IReview) {
    if (!this.property && this.resort) {
        this.property = this.resort;
    } else if (!this.resort && this.property) {
        this.resort = this.property;
    }
});

export const Review = model<IReview>("Review", reviewSchema);
export default Review;

