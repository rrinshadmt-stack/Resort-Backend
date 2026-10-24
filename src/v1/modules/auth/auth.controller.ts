
import type { Request, Response, NextFunction } from "express";
import {
    registerUser,
    loginUser,
    verifyOtpService,
    resendOtpService,
} from "./auth.service";
import { AppError } from "../../../utils/errors";
import type {
    RegisterInput,
    LoginInput,
    VerifyOtpInput,
    ResendOtpInput,
} from "./auth.validation";


export const register = async (
    req: Request<{}, {}, RegisterInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await registerUser(req.body);

        res.status(201).json({
            success: true,
            message: result.message,
            data: {
                email: result.email,
                name: result.name,
                isVerified: result.isVerified,
            },
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
            return;
        }

        next(error);
    }
};


//   Verifies 6-digit OTP and authenticates user
//   POST /api/auth/verify-otp

export const verifyOtp = async (
    req: Request<{}, {}, VerifyOtpInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await verifyOtpService(req.body);

        // Store refresh token in secure HTTP-only cookie for web browsers
        const isProduction = process.env.NODE_ENV === "production";

        res.cookie("refreshToken", result.tokens.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(200).json({
            success: true,
            message: "Email verified successfully. Account activated!",
            data: {
                user: result.user,
                accessToken: result.tokens.accessToken,
                refreshToken: result.tokens.refreshToken,
            },
        });
    } catch (error) {
        next(error);
    }
};

//  Resends a fresh 6-digit OTP
//  POST /api/auth/resend-otp

export const resendOtp = async (
    req: Request<{}, {}, ResendOtpInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {

        const result = await resendOtpService(req.body);

        res.status(200).json({
            success: true,
            message: result.message,
            data: {
                email: result.email,
            },
        });
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({
                success: false,
                message: error.message,
            });
            return;
        }

        next(error);
    }
};

// POST /api/auth/login
export const login = async (
    req: Request<{}, {}, LoginInput>,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const result = await loginUser(req.body);

        const isProduction = process.env.NODE_ENV === "production";

        res.cookie("refreshToken", result.tokens.refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "strict" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: result.user,
                accessToken: result.tokens.accessToken,
            },
        });
    } catch (error) {
        next(error);
    }
};
