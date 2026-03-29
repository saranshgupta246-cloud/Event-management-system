import express from "express";
import { requireAuth, requireStudent } from "../middleware/auth.middleware.js";
import {
  validateSchema,
  applicationsApplySchema,
  applicationsStatusSchema,
  applicationsEmailSchema,
  applicationsBulkStatusSchema,
  applicationsRatingSchema,
} from "../middleware/validate.js";
import {
  requireApplicationClubMember,
  apply,
  getMyApplications,
  listDriveApplications,
  getApplicationById,
  updateApplicationStatus,
  sendApplicationEmail,
  bulkStatusUpdate,
  updateApplicationRating,
} from "../controllers/applicationsController.js";

const driveApplyRouter = express.Router();
driveApplyRouter.post(
  "/:driveId/apply",
  requireAuth,
  requireStudent,
  validateSchema(applicationsApplySchema),
  apply
);

const applicationsRouter = express.Router();
applicationsRouter.get("/my-applications", requireAuth, requireStudent, getMyApplications);

applicationsRouter.post(
  "/bulk-status",
  requireAuth,
  validateSchema(applicationsBulkStatusSchema),
  bulkStatusUpdate
);

const applicationIdRouter = express.Router({ mergeParams: true });
applicationIdRouter.get("/:applicationId", requireAuth, getApplicationById);
applicationIdRouter.patch(
  "/:applicationId/status",
  requireAuth,
  requireApplicationClubMember,
  validateSchema(applicationsStatusSchema),
  updateApplicationStatus
);
applicationIdRouter.post(
  "/:applicationId/email",
  requireAuth,
  requireApplicationClubMember,
  validateSchema(applicationsEmailSchema),
  sendApplicationEmail
);
applicationIdRouter.patch(
  "/:applicationId/rating",
  requireAuth,
  requireApplicationClubMember,
  validateSchema(applicationsRatingSchema),
  updateApplicationRating
);

applicationsRouter.use("/", applicationIdRouter);

export { driveApplyRouter, applicationsRouter };
