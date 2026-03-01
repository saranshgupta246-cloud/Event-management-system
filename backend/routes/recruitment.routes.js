import express from "express";
import { body } from "express-validator";
import { requireAuth, requireClubAccess, optionalAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createDrive,
  listDrivesByClub,
  listGlobalDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
} from "../controllers/recruitment.controller.js";
import { listDriveApplications } from "../controllers/applications.controller.js";

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
clubDrivesRouter.post(
  "/",
  requireAuth,
  requireClubAccess(2),
  createDriveValidation,
  validate,
  createDrive
);
clubDrivesRouter.get("/:driveId", optionalAuth, getDriveById);
clubDrivesRouter.patch(
  "/:driveId",
  requireAuth,
  requireClubAccess(2),
  updateDriveValidation,
  validate,
  updateDrive
);
clubDrivesRouter.delete("/:driveId", requireAuth, requireClubAccess(1), deleteDrive);

clubDrivesRouter.get(
  "/:driveId/applications",
  requireAuth,
  requireClubAccess(4),
  listDriveApplications
);

const globalDrivesRouter = express.Router();
globalDrivesRouter.get("/", listGlobalDrives);

export { clubDrivesRouter, globalDrivesRouter };
