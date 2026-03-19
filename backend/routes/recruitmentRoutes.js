import express from "express";
import { body } from "express-validator";
import { requireAuth, requireClubAccess, optionalAuth, requireCoordinatorOnly, requireCoordinatorOrPresident } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createDrive,
  listDrivesByClub,
  listGlobalDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
} from "../controllers/recruitmentController.js";
import { listDriveApplications } from "../controllers/applicationsController.js";

const CLUB_CATEGORIES = ["Technical", "Cultural", "Sports", "Marketing"];

const createDriveValidation = [
  body("title").trim().notEmpty().withMessage("title is required"),
  body("roleTitle").trim().notEmpty().withMessage("roleTitle is required"),
  body("description").trim().notEmpty().withMessage("description is required"),
  body("deadline").notEmpty().withMessage("deadline is required"),
  body("requiredSkills").optional().isArray(),
  body("customQuestions").optional().isArray(),
  body("maxApplicants").optional().isInt({ min: 1 }),
];

const updateDriveValidation = [
  body("title").optional().trim().notEmpty(),
  body("roleTitle").optional().trim().notEmpty(),
  body("description").optional().trim().notEmpty(),
  body("requiredSkills").optional().isArray(),
  body("customQuestions").optional().isArray(),
  body("deadline").optional(),
  body("maxApplicants").optional().isInt({ min: 1 }),
  body("status").optional().isIn(["draft", "open", "paused", "closed"]),
];

const clubDrivesRouter = express.Router({ mergeParams: true });

clubDrivesRouter.get("/", listDrivesByClub);
// Only Faculty Coordinator can create recruitment drives
clubDrivesRouter.post(
  "/",
  requireAuth,
  requireCoordinatorOnly("clubId"),
  createDriveValidation,
  validate,
  createDrive
);
clubDrivesRouter.get("/:driveId", optionalAuth, getDriveById);
// Only Faculty Coordinator can update recruitment drives
clubDrivesRouter.patch(
  "/:driveId",
  requireAuth,
  requireCoordinatorOnly("clubId"),
  updateDriveValidation,
  validate,
  updateDrive
);
// Only Faculty Coordinator can delete recruitment drives
clubDrivesRouter.delete("/:driveId", requireAuth, requireCoordinatorOnly("clubId"), deleteDrive);

// Both Coordinator and President can review applications
clubDrivesRouter.get(
  "/:driveId/applications",
  requireAuth,
  requireCoordinatorOrPresident("clubId"),
  listDriveApplications
);

const globalDrivesRouter = express.Router();
globalDrivesRouter.get("/", listGlobalDrives);

export { clubDrivesRouter, globalDrivesRouter };
