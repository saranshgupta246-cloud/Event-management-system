import express from "express";
import { requireAuth, optionalAuth, requireCoordinatorOnly, requireCoordinatorOrPresident } from "../middleware/auth.middleware.js";
import { validateSchema, recruitmentCreateDriveSchema, recruitmentUpdateDriveSchema } from "../middleware/validate.js";
import {
  createDrive,
  listDrivesByClub,
  listGlobalDrives,
  getDriveById,
  updateDrive,
  deleteDrive,
} from "../controllers/recruitmentController.js";
import { listDriveApplications } from "../controllers/applicationsController.js";

const clubDrivesRouter = express.Router({ mergeParams: true });

clubDrivesRouter.get("/", listDrivesByClub);
// Only Faculty Coordinator can create recruitment drives
clubDrivesRouter.post(
  "/",
  requireAuth,
  requireCoordinatorOnly("clubId"),
  validateSchema(recruitmentCreateDriveSchema),
  createDrive
);
clubDrivesRouter.get("/:driveId", optionalAuth, getDriveById);
// Only Faculty Coordinator can update recruitment drives
clubDrivesRouter.patch(
  "/:driveId",
  requireAuth,
  requireCoordinatorOnly("clubId"),
  validateSchema(recruitmentUpdateDriveSchema),
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
