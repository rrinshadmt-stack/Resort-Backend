import { Schema, model, Document, Types } from "mongoose";

export interface IRoom extends Document {
    resort: Types.ObjectId;
    type: string;
    description?: string;
    price: number;
    capacity: number;
    totalRooms: number;
    amenities: string[];
    images: { url: string; publicId: string }[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const roomSchema = new Schema<IRoom>(
    {
        resort: {
            type: Schema.Types.ObjectId,
            ref: "Resort",
            required: true,
            index: true,
        },
        type: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        price: { type: Number, required: true, min: 0 },
        capacity: { type: Number, required: true, min: 1 },
        totalRooms: { type: Number, required: true, min: 1 },
        amenities: { type: [String], default: [] },
        images: [
            {
                url: { type: String, required: true },
                publicId: { type: String, required: true },
                _id: false,
            },
        ],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Room = model<IRoom>("Room", roomSchema);
export default Room;