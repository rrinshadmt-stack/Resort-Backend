import { z } from "zod";
import { STAGE_STATUSES } from "../../../models/verification.model";

export const reviewStageSchema = z.object({
    status: z.enum(STAGE_STATUSES, {
        message: "Status must be Pending, Under Review, Approved, or Rejected",
    }),
    remarks: z.string().trim().max(1000).optional(),
});

export type ReviewStageInput = z.infer<typeof reviewStageSchema>;

export const requestMissingDocumentSchema = z.object({
    documentName: z
        .string({ message: "Document name is required" })
        .trim()
        .min(2)
        .max(100),
    instructions: z
        .string({ message: "Instructions are required" })
        .trim()
        .min(5)
        .max(500),
    stage: z.enum(["user", "company", "property"], {
        message: "Stage must be user, company, or property",
    }),
});

export type RequestMissingDocumentInput = z.infer<typeof requestMissingDocumentSchema>;

