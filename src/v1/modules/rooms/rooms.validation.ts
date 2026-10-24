import { z } from "zod";

// multipart form fields arrive as strings, so numbers are coerced
// and amenities is split from "wifi, pool, spa" into an array
const amenitiesField = z.preprocess(
    (value) =>
        typeof value === "string"
            ? value
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : value,
    z.array(z.string().trim())
);

export const createRoomSchema = z.object({
    type: z
        .string({ message: "Room type is required" })
        .trim()
        .min(2, "Room type must be at least 2 characters long")
        .max(50, "Room type must not exceed 50 characters"),
    description: z
        .string()
        .trim()
        .max(1000, "Description must not exceed 1000 characters")
        .optional(),
    price: z.coerce
        .number({ message: "Price is required" })
        .min(0, "Price cannot be negative"),
    capacity: z.coerce
        .number({ message: "Capacity is required" })
        .int("Capacity must be a whole number")
        .min(1, "Capacity must be at least 1"),
    totalRooms: z.coerce
        .number({ message: "Total rooms is required" })
        .int("Total rooms must be a whole number")
        .min(1, "Total rooms must be at least 1"),
    amenities: amenitiesField.optional(),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

export const updateRoomSchema = createRoomSchema.partial();

export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;