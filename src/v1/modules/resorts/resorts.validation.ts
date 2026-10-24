import { z } from "zod";
import { RESORT_STATUS } from "../../../models/resort.model";

// multipart fields arrive as strings: "wifi, pool, spa" -> ["wifi","pool","spa"]
const csvField = z.preprocess(
    (value) =>
        typeof value === "string"
            ? value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : value,
    z.array(z.string().trim())
);

const lat = z.coerce.number().min(-90, "Invalid latitude").max(90, "Invalid latitude");
const lng = z.coerce.number().min(-180, "Invalid longitude").max(180, "Invalid longitude");

export const createResortSchema = z.object({
    name: z.string({ message: "Name is required" }).trim().min(2).max(100),
    description: z
        .string({ message: "Description is required" })
        .trim()
        .min(10, "Description must be at least 10 characters")
        .max(3000),
    address: z.string({ message: "Address is required" }).trim().min(3).max(300),
    city: z.string({ message: "City is required" }).trim().min(2).max(100),
    lat,
    lng,
    amenities: csvField.optional(),
});

export type CreateResortInput = z.infer<typeof createResortSchema>;

export const updateResortSchema = createResortSchema
    .partial()
    .refine((d) => (d.lat === undefined) === (d.lng === undefined), {
        message: "lat and lng must be sent together",
        path: ["lat"],
    });

export type UpdateResortInput = z.infer<typeof updateResortSchema>;

export const updateStatusSchema = z.object({
    status: z.enum(RESORT_STATUS, { message: "Invalid status" }),
});

const listBase = z.object({
    q: z.string().trim().max(100).optional(),
    city: z.string().trim().max(100).optional(),
    amenities: csvField.optional(),
    lat: lat.optional(),
    lng: lng.optional(),
    radiusKm: z.coerce.number().min(1).max(500).default(25),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
});

const bothOrNeither = (d: { lat?: number; lng?: number }) =>
    (d.lat === undefined) === (d.lng === undefined);

export const listResortsQuerySchema = listBase.refine(bothOrNeither, {
    message: "lat and lng must be sent together",
    path: ["lat"],
});

export const adminListResortsQuerySchema = listBase
    .extend({ status: z.enum(RESORT_STATUS).optional() })
    .refine(bothOrNeither, {
        message: "lat and lng must be sent together",
        path: ["lat"],
    });

export type ListResortsQuery = z.infer<typeof adminListResortsQuerySchema>;