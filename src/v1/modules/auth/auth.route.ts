

import { Router } from "express";
import {
    register,
    login,
    verifyOtp,
    resendOtp,
} from "./auth.controller";
import { validate } from "../../../middleware/validate";
import {
    registerSchema,
    loginSchema,
    verifyOtpSchema,
    resendOtpSchema,
} from "./auth.validation";

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user & trigger 6-digit OTP verification email
 * @access  Public
 */
router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

/**
 * @route   POST /api/auth/v1/verify-otp
 * @desc    Verify 6-digit OTP code, activate account, and return auth JWT tokens
 * @access  Public
 */
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);

/**
 * @route   POST /api/auth/v1/resend-otp
 * @desc    Resend a new 6-digit OTP code to an unverified email
 * @access  Public
 */
router.post("/resend-otp", validate(resendOtpSchema), resendOtp);

export default router;
