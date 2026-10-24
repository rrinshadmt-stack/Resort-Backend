
import { User } from "../../../models/user.model";
import { RefreshToken } from "../../../models/refresh-token.model";
import { hashPassword, comparePassword } from "../../../utils/password";
import {
    generateAccessToken,
    generateRefreshToken,
    hashToken,
    calculateRefreshTokenExpiryDate,
} from "../../../utils/jwt";
import { AppError } from "../../../utils/errors";
import { sendOtpEmail } from "../email/email.service";
import type {
    RegisterInput,
    LoginInput,
    VerifyOtpInput,
    ResendOtpInput,
} from "./auth.validation";


export interface RegisterInitResult {
    email: string;
    name: string;
    isVerified: boolean;
    message: string;
}

export interface AuthSessionResult {
    user: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        role: string;
        isVerified: boolean;
        createdAt: Date;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

export interface LoginResult {
    user: {
        id: string;
        name: string;
        email: string;
        phone: string | null;
        role: string;
        createdAt: Date;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

/**
 * Registers a new user in unverified state and sends a 6-digit verification OTP.
 */
export const registerUser = async (input: RegisterInput): Promise<RegisterInitResult> => {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
        if (existingUser.isVerified) {
            throw new AppError("User with this email already exists. Please sign in.", 409);
        }

        // If user registered previously but not yet verified, update details and send a new OTP
        const passwordHash = await hashPassword(input.password);
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        existingUser.name = input.name.trim();
        existingUser.passwordHash = passwordHash;
        existingUser.phone = input.phone?.trim() || null;
        existingUser.role = input.role || "CUSTOMER";
        existingUser.otpCode = otp;
        existingUser.otpExpiresAt = otpExpiresAt;
        await existingUser.save();

        await sendOtpEmail(normalizedEmail, otp, existingUser.name);

        return {
            email: existingUser.email,
            name: existingUser.name,
            isVerified: false,
            message: "A verification code has been sent to your email.",
        };
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);


    // Generate 6-digit OTP code and 10-minute expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Assign the user's role
    const assignedRole =
        input.role === "OWNER" ? "OWNER" : "CUSTOMER";

    // Create an unverified user
    const newUser = await User.create({
        name: input.name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: input.phone?.trim() || null,
        role: assignedRole,
        isVerified: false,
        otpCode: otp,
        otpExpiresAt,
    });

    // Dispatch OTP email via Nodemailer
    await sendOtpEmail(normalizedEmail, otp, newUser.name);

    return {
        email: newUser.email,
        name: newUser.name,
        isVerified: false,
        message: "Verification code sent to your email. Please verify to complete registration.",
    };
};

/**
 * Verifies the 6-digit OTP, activates the user, and generates auth JWT tokens.
 */
export const verifyOtpService = async (input: VerifyOtpInput): Promise<AuthSessionResult> => {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        throw new AppError("No account found with this email address", 404);
    }

    if (user.isVerified) {
        throw new AppError("Account is already verified. Please sign in.", 400);
    }

    if (!user.otpCode || user.otpCode !== input.otp.trim()) {
        throw new AppError("Invalid verification code. Please check and try again.", 400);
    }

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
        throw new AppError("Verification code has expired. Please request a new one.", 400);
    }

    // Mark as verified & clear OTP
    user.isVerified = true;
    user.otpCode = null as any;
    user.otpExpiresAt = null as any;
    await user.save();

    // Generate Access and Refresh JWTs
    const tokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store SHA-256 hash of refresh token for security session
    const tokenHash = hashToken(refreshToken);
    const expiresAt = calculateRefreshTokenExpiryDate();

    await RefreshToken.create({
        userId: user._id,
        tokenHash,
        expiresAt,
    });

    return {
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            phone: user.phone ?? null,
            role: user.role,
            isVerified: user.isVerified,
            createdAt: (user as unknown as { createdAt: Date }).createdAt,
        },
        tokens: {
            accessToken,
            refreshToken,
        },
    };
};


/**
 * Resends a fresh 6-digit OTP code to an unverified user.
 */
export const resendOtpService = async (
    input: ResendOtpInput
): Promise<{ message: string; email: string }> => {
    const normalizedEmail = input.email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        throw new AppError("No account found with this email address", 404);
    }

    if (user.isVerified) {
        throw new AppError(
            "Account is already verified. You can sign in directly.",
            400
        );
    }

    // Generate a new OTP with a 10-minute expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otpCode = otp;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();
    await sendOtpEmail(normalizedEmail, otp, user.name);

    return {
        email: user.email,
        message: "A new 6-digit verification code has been sent to your email.",
    };
};

/**
 * Authenticates an existing user and creates a session.
 */
export const loginUser = async (
    input: LoginInput
): Promise<LoginResult> => {
    const normalizedEmail = input.email.toLowerCase().trim();

    // Find the user by email
    const existingUser = await User.findOne({
        email: normalizedEmail,
    });

    if (!existingUser) {
        throw new AppError("Invalid email or password", 401);
    }

    // Compare the submitted password with the stored hash
    const isPasswordValid = await comparePassword(
        input.password,
        existingUser.passwordHash
    );

    if (!isPasswordValid) {
        throw new AppError("Invalid email or password", 401);
    }

    // Prevent unverified accounts from logging in
    if (!existingUser.isVerified) {
        throw new AppError(
            "Please verify your email before logging in.",
            403
        );
    }

    // Prepare the user information for JWT generation
    const tokenPayload = {
        userId: existingUser._id.toString(),
        email: existingUser.email,
        role: existingUser.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store a hash of the refresh token
    const tokenHash = hashToken(refreshToken);
    const expiresAt = calculateRefreshTokenExpiryDate();

    await RefreshToken.create({
        userId: existingUser._id,
        tokenHash,
        expiresAt,
    });

    return {
        user: {
            id: existingUser._id.toString(),
            name: existingUser.name,
            email: existingUser.email,
            phone: existingUser.phone ?? null,
            role: existingUser.role,
            createdAt: existingUser.createdAt,
        },
        tokens: {
            accessToken,
            refreshToken,
        },
    };
};
