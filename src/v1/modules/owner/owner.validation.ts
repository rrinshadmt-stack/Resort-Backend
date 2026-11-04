import { z } from "zod";

// Owner Profile Validation
export const ownerProfileSchema = z.object({
    businessName: z
        .string({ message: "Business name is required" })
        .trim()
        .min(2, "Business name must be at least 2 characters long")
        .max(100),
    businessType: z
        .string({ message: "Business type is required" })
        .trim()
        .min(2, "Business type is required")
        .max(50),
    businessRegistrationNumber: z
        .string({ message: "Business registration number is required" })
        .trim()
        .min(2, "Registration number is required")
        .max(50),
    gstNumber: z.string().trim().max(30).optional().nullable(),
    businessAddress: z.object({
        street: z.string().trim().optional(),
        city: z.string({ message: "City is required" }).trim().min(2),
        state: z.string().trim().optional(),
        postalCode: z.string().trim().optional(),
        country: z.string({ message: "Country is required" }).trim().min(2),
    }),
    contactNumber: z
        .string({ message: "Contact number is required" })
        .trim()
        .regex(/^[0-9+\s\-()]{7,20}$/, "Invalid contact number format"),
});

export type OwnerProfileInput = z.infer<typeof ownerProfileSchema>;

// Step 1: User Verification Validation
export const step1UserVerificationSchema = z.object({
    fullName: z
        .string({ message: "Full name as on identity document is required" })
        .trim()
        .min(2, "Full name must be at least 2 characters")
        .max(100),
    idType: z
        .string({ message: "Identity document type is required" })
        .trim()
        .min(2, "Identity type is required")
        .max(50),
    idNumber: z
        .string({ message: "Identity document number is required" })
        .trim()
        .min(2, "ID number is required")
        .max(50),
    phone: z
        .string()
        .trim()
        .regex(/^[0-9+\s\-()]{7,20}$/, "Invalid phone number format")
        .optional(),
});

export type Step1UserVerificationInput = z.infer<typeof step1UserVerificationSchema>;

// Step 2: Company Verification Validation
export const step2CompanyVerificationSchema = z.object({
    businessName: z
        .string({ message: "Business name is required" })
        .trim()
        .min(2)
        .max(100),
    businessType: z
        .string({ message: "Business type is required" })
        .trim()
        .min(2)
        .max(50),
    businessRegistrationNumber: z
        .string({ message: "Business registration number is required" })
        .trim()
        .min(2)
        .max(50),
    gstNumber: z.string().trim().max(30).optional().nullable(),
});

export type Step2CompanyVerificationInput = z.infer<typeof step2CompanyVerificationSchema>;

// Step 3: Property Verification Validation
export const step3PropertyVerificationSchema = z.object({
    propertyName: z
        .string({ message: "Property name is required" })
        .trim()
        .min(2, "Property name must be at least 2 characters")
        .max(100),
    propertyType: z
        .enum(["resort", "villa", "apartment", "building"], {
            message: "Property type must be resort, villa, apartment, or building",
        })
        .default("resort"),
    propertyAddress: z
        .string({ message: "Property address is required" })
        .trim()
        .min(5, "Property address must be at least 5 characters")
        .max(300),
    city: z.string().trim().max(100).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    mapUrl: z.string().trim().url("Invalid Google Maps URL").optional().nullable(),
});

export type Step3PropertyVerificationInput = z.infer<typeof step3PropertyVerificationSchema>;

