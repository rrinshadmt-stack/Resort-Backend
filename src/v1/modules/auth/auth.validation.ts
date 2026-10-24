import { z } from "zod";


export const registerSchema = z.object({
    name: z
        .string({ message: "Name is required" })
        .trim()
        .min(2, "Name must be at least 2 characters long")
        .max(50, "Name must not exceed 50 characters"),
    email: z
        .string({ message: "Email is required" })
        .trim()
        .email("Please provide a valid email address")
        .toLowerCase(),
    password: z
        .string({ message: "Password is required" })
        .min(6, "Password must be at least 6 characters long")
        .max(100, "Password cannot exceed 100 characters"),
    phone: z
        .string()
        .trim()
        .regex(/^[0-9+\s\-()]{7,20}$/, "Invalid phone number format")
        .optional()
        .nullable(),
    role: z
        .enum(["CUSTOMER", "OWNER"])
        .optional()
        .default("CUSTOMER"),

});

export type RegisterInput = z.infer<typeof registerSchema>;


export const verifyOtpSchema = z.object({
    email: z
        .string({ message: "Email is required" })
        .trim()
        .email("Please provide a valid email address")
        .toLowerCase(),
    otp: z
        .string({ message: "OTP is required" })
        .trim()
        .length(6, "OTP must be exactly 6 digits")
        .regex(/^\d{6}$/, "OTP must consist of digits only"),
});

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const resendOtpSchema = z.object({
    email: z
        .string({ message: "Email is required" })
        .trim()
        .email("Please provide a valid email address")
        .toLowerCase(),
});

export type ResendOtpInput = z.infer<typeof resendOtpSchema>;

export const loginSchema = z.object({
    email: z
        .string({ message: "Email is required" })
        .trim()
        .email("Please provide a valid email")
        .toLowerCase(),
    password: z
        .string({ message: "Password is required" })
        .min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;
