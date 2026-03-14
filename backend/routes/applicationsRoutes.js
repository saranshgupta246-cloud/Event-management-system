import express from "express";
import { body } from "express-validator";
import {
  requireAuth,
  requireClubAccess,
  requireStudent,
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
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

const applyValidation = [
  body("answers").optional().isArray(),
  body("resumeUrl").optional().isURL(),
  body("portfolioUrl").optional().isURL(),
];

const statusValidation = [
  body("status").isIn(["pending", "shortlisted", "interview", "selected", "rejected", "withdrawn"]),
  body("note").optional(),
];

const emailValidation = [
  body("subject").trim().notEmpty().withMessage("subject is required"),
  body("body").trim().notEmpty().withMessage("body is required"),
  body("templateUsed").optional().isIn(["shortlist", "interview", "rejection", "offer", "custom"]),
];

const bulkStatusValidation = [
  body("applicationIds").isArray().withMessage("applicationIds must be an array"),
  body("applicationIds.*").isMongoId(),
  body("status").isIn(["pending", "shortlisted", "interview", "selected", "rejected", "withdrawn"]),
  body("note").optional(),
];

const ratingValidation = [
  body("rating").optional().isInt({ min: 1, max: 5 }),
  body("reviewNotes").optional(),
];

const driveApplyRouter = express.Router();
driveApplyRouter.post(
  "/:driveId/apply",
  requireAuth,
  requireStudent,
  applyValidation,
  validate,
  apply
);

const applicationsRouter = express.Router();
applicationsRouter.get("/my-applications", requireAuth, requireStudent, getMyApplications);

applicationsRouter.post(
  "/applications/bulk-status",
  requireAuth,
  bulkStatusValidation,
  validate,
  bulkStatusUpdate
);

const applicationIdRouter = express.Router({ mergeParams: true });
applicationIdRouter.get("/:applicationId", requireAuth, getApplicationById);
applicationIdRouter.patch(
  "/:applicationId/status",
  requireAuth,
  requireApplicationClubMember,
  statusValidation,
  validate,
  updateApplicationStatus
);
applicationIdRouter.post(
  "/:applicationId/email",
  requireAuth,
  requireApplicationClubMember,
  emailValidation,
  validate,
  sendApplicationEmail
);
applicationIdRouter.patch(
  "/:applicationId/rating",
  requireAuth,
  requireApplicationClubMember,
  ratingValidation,
  validate,
  updateApplicationRating
);

applicationsRouter.use("/applications", applicationIdRouter);

export { driveApplyRouter, applicationsRouter };
