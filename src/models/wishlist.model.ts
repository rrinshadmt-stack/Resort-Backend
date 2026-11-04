import { Schema, model, Document, Types } from "mongoose";

export interface IWishlist extends Document {
    user: Types.ObjectId;
    property: Types.ObjectId;
    resort: Types.ObjectId;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const wishlistSchema = new Schema<IWishlist>(
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
        notes: {
            type: String,
            trim: true,
            default: null,
        },
    },
    { timestamps: true }
);

// Compound unique index so a property can only be wishlisted once per user
wishlistSchema.index({ user: 1, property: 1 }, { unique: true });

// Pre-validate hook: keep property & resort in sync
wishlistSchema.pre("validate", function (this: IWishlist) {
    if (!this.property && this.resort) {
        this.property = this.resort;
    } else if (!this.resort && this.property) {
        this.resort = this.property;
    }
});

export const Wishlist = model<IWishlist>("Wishlist", wishlistSchema);
export default Wishlist;

