import Room from "../../../models/room.model";
import type { UploadedImage } from "../../../utils/upload.utils";
import type { CreateRoomInput, UpdateRoomInput } from "./rooms.validation";

export const getRoomsByResort = async (resortId: string) => {
    return await Room.find({ resort: resortId, isActive: true }).sort({
        price: 1,
    });
};

export const getRoomById = async (id: string) => {
    return await Room.findById(id);
};

export const createRoom = async (
    resortId: string,
    data: CreateRoomInput,
    images: UploadedImage[]
) => {
    return await Room.create({ ...data, resort: resortId, images });
};

export const updateRoom = async (
    id: string,
    data: UpdateRoomInput,
    newImages: UploadedImage[] = []
) => {
    return await Room.findByIdAndUpdate(
        id,
        {
            $set: data,
            ...(newImages.length > 0 && {
                $push: { images: { $each: newImages } },
            }),
        },
        { new: true, runValidators: true }
    );
};

export const deleteRoom = async (id: string) => {
    return await Room.findByIdAndDelete(id);
};