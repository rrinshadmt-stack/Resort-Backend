import type { QueryFilter } from "mongoose";
import Resort, { type IResort, type ResortStatus } from "../../../models/resort.model";
import Room from "../../../models/room.model";
import type { UploadedImage } from "../../../utils/upload.utils";
import type {
    CreateResortInput,
    UpdateResortInput,
    ListResortsQuery,
} from "./resorts.validation";

const EARTH_RADIUS_KM = 6378.1;

const escapeRegex = (value: string): string =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type ListOptions = Partial<ListResortsQuery> & {
    status?: ResortStatus;
    owner?: string;
    page: number;
    limit: number;
};

export const listResorts = async (opts: ListOptions) => {
    const filter: QueryFilter<IResort> = {};

    if (opts.status) filter.status = opts.status;
    if (opts.owner) filter.owner = opts.owner;
    if (opts.city) filter.city = new RegExp(`^${escapeRegex(opts.city)}$`, "i");
    if (opts.amenities && opts.amenities.length > 0) {
        filter.amenities = { $all: opts.amenities };
    }
    if (opts.q) {
        const rx = new RegExp(escapeRegex(opts.q), "i");
        filter.$or = [{ name: rx }, { city: rx }, { address: rx }];
    }
    if (opts.lat !== undefined && opts.lng !== undefined) {
        const radiusKm = opts.radiusKm ?? 25;
        filter.location = {
            $geoWithin: {
                $centerSphere: [[opts.lng, opts.lat], radiusKm / EARTH_RADIUS_KM],
            },
        };
    }

    const skip = (opts.page - 1) * opts.limit;
    const [data, total] = await Promise.all([
        Resort.find(filter).sort({ createdAt: -1 }).skip(skip).limit(opts.limit),
        Resort.countDocuments(filter),
    ]);

    return {
        data,
        total,
        page: opts.page,
        pages: Math.ceil(total / opts.limit),
    };
};

export const getResortById = async (id: string) => {
    return await Resort.findById(id);
};

export const createResort = async (
    ownerId: string,
    input: CreateResortInput,
    images: UploadedImage[]
) => {
    const { lat, lng, ...rest } = input;
    return await Resort.create({
        ...rest,
        owner: ownerId,
        images,
        location: { type: "Point", coordinates: [lng, lat] },
        status: "PENDING",
    });
};

export const updateResort = async (
    id: string,
    input: UpdateResortInput,
    newImages: UploadedImage[] = []
) => {
    const { lat, lng, ...rest } = input;
    const set: Record<string, unknown> = { ...rest };
    if (lat !== undefined && lng !== undefined) {
        set.location = { type: "Point", coordinates: [lng, lat] };
    }

    return await Resort.findByIdAndUpdate(
        id,
        {
            $set: set,
            ...(newImages.length > 0 && {
                $push: { images: { $each: newImages } },
            }),
        },
        { new: true, runValidators: true }
    );
};

export const setResortStatus = async (id: string, status: ResortStatus) => {
    return await Resort.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true }
    );
};

// Deletes the resort and its rooms. Returns every image that must be removed from Cloudinary.
export const deleteResortCascade = async (
    resort: IResort
): Promise<UploadedImage[]> => {
    const rooms = await Room.find({ resort: resort._id }).select("images");
    const images: UploadedImage[] = [
        ...resort.images,
        ...rooms.flatMap((r) => r.images),
    ];

    // TODO (bookings): block deletion when active/future bookings exist
    await Room.deleteMany({ resort: resort._id });
    await Resort.deleteOne({ _id: resort._id });

    return images;
};