import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/role.middleware";
import { validate } from "../../../middleware/validate";
import { privateUpload } from "../../../middleware/private-upload.middleware";
import {
    ownerProfileSchema,
    step1UserVerificationSchema,
    step2CompanyVerificationSchema,
    step3PropertyVerificationSchema,
} from "./owner.validation";
import {
    getProfileHandler,
    upsertProfileHandler,
    getVerificationStatusHandler,
    submitStep1Handler,
    submitStep2Handler,
    submitStep3Handler,
    getSecureDocumentHandler,
} from "./owner.controller";

const router = Router();

// All owner routes require authenticated property owner or admin
router.use(authenticate, authorize("property_owner", "admin"));

// Owner Profile
router.get("/profile", getProfileHandler);
router.post("/profile", validate(ownerProfileSchema), upsertProfileHandler);
router.put("/profile", validate(ownerProfileSchema), upsertProfileHandler);

// Three-Step Verification
router.get("/verification/status", getVerificationStatusHandler);

// Step 1: User Verification (ID document)
router.post(
    "/verification/step1",
    privateUpload.single("idDocument"),
    validate(step1UserVerificationSchema),
    submitStep1Handler
);

// Step 2: Company Verification (registration cert + optional other approvals)
router.post(
    "/verification/step2",
    privateUpload.fields([
        { name: "registrationCertificate", maxCount: 1 },
        { name: "otherApprovals", maxCount: 5 },
    ]),
    validate(step2CompanyVerificationSchema),
    submitStep2Handler
);

// Step 3: Property Verification (ownership proof + optional operating licenses)
router.post(
    "/verification/step3",
    privateUpload.fields([
        { name: "ownershipProof", maxCount: 1 },
        { name: "operatingLicenses", maxCount: 5 },
    ]),
    validate(step3PropertyVerificationSchema),
    submitStep3Handler
);

// Secure document viewing for owner
router.get("/verification/documents/:fileKey", getSecureDocumentHandler);

export default router;

