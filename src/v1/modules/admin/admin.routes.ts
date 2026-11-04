import { Router } from "express";
import { authenticate } from "../../../middleware/auth.middleware";
import { authorize } from "../../../middleware/role.middleware";
import { validate } from "../../../middleware/validate";
import {
    reviewStageSchema,
    requestMissingDocumentSchema,
} from "./admin.validation";
import {
    listOwnersHandler,
    getOwnerDossierHandler,
    reviewStageHandler,
    requestMissingDocsHandler,
    adminGetSecureDocHandler,
} from "./admin.controller";

const router = Router();

// All admin routes require admin authorization
router.use(authenticate, authorize("admin"));

// View registered building owners
router.get("/verification/owners", listOwnersHandler);

// View full dossier for an owner
router.get("/verification/owners/:ownerId", getOwnerDossierHandler);

// Review an individual stage (user | company | property)
router.patch(
    "/verification/owners/:ownerId/stages/:stage",
    validate(reviewStageSchema),
    reviewStageHandler
);

// Request missing documents
router.post(
    "/verification/owners/:ownerId/request-documents",
    validate(requestMissingDocumentSchema),
    requestMissingDocsHandler
);

// Securely view uploaded sensitive document
router.get(
    "/verification/owners/:ownerId/documents/:fileKey",
    adminGetSecureDocHandler
);

export default router;

