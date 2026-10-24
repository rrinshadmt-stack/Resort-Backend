import mongoose, { Schema, Document, Types } from "mongoose";

export const RESORT_STATUS = ["PENDING", "APPROVED", "REJECTED", "SUSPENDED"] as const;
export type ResortStatus = (typeof RESORT_STATUS)[number];

export interface IResort extends Document {
  owner: Types.ObjectId;
  name: string;
  description: string;
  address: string;
  city: string;
  location: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
  images: { url: string; publicId: string }[];
  amenities: string[];
  rating: number;
  reviewCount: number;
  status: ResortStatus;
  createdAt: Date;
  updatedAt: Date;
}

const resortSchema = new Schema<IResort>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
        _id: false,
      },
    ],
    amenities: { type: [String], default: [] },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: RESORT_STATUS, default: "PENDING", index: true },
  },
  { timestamps: true }
);

resortSchema.index({ location: "2dsphere" });

const Resort = mongoose.model<IResort>("Resort", resortSchema);
export default Resort;