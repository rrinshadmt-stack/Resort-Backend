import { Schema, model, Document, Types } from "mongoose";

export interface IRoom extends Document {
    resort: Types.ObjectId;
    property?: Types.ObjectId;
    name?: string;
    type: string;
    roomType?: string;
    description?: string;
    price: number;
    capacity: number;
    totalRooms: number;
    amenities: string[];
    images: { url: string; publicId: string }[];
    isActive: boolean;
    isAvailable: boolean;
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
        property: {
            type: Schema.Types.ObjectId,
            ref: "Resort",
        },
        name: {
            type: String,
            trim: true,
        },
        type: { type: String, required: true, trim: true },
        roomType: { type: String, trim: true },
        description: { type: String, trim: true },
        price: { type: Number, required: true, min: 0 },
        capacity: { type: Number, required: true, min: 1 },
        totalRooms: { type: Number, required: true, min: 1, default: 1 },
        amenities: { type: [String], default: [] },
        images: [
            {
                url: { type: String, required: true },
                publicId: { type: String, required: true },
                _id: false,
            },
        ],
        isActive: { type: Boolean, default: true },
        isAvailable: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Populate property from resort if not explicitly provided
roomSchema.pre("save", function () {
    if (!this.property && this.resort) {
        this.property = this.resort;
    }
    if (!this.name && this.type) {
        this.name = this.type;
    }
    if (!this.roomType && this.type) {
        this.roomType = this.type;
    }
});

const Room = model<IRoom>("Room", roomSchema);
export default Room;
