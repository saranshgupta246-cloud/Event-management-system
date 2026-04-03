import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  createRegistration,
  listEventParticipants,
  exportParticipantsCsv,
  removeParticipant,
  bulkRemoveParticipants,
  getMyRegistrations,
  cancelRegistration,
  revokeRegistrationPayment,
} from "../controllers/registrationController.js";

const router = express.Router();

router.use(protect);

router.post("/", createRegistration);
router.get("/my", getMyRegistrations);
router.post("/:id/cancel", cancelRegistration);
router.get(
  "/event/:eventId/participants",
  authorize("admin", "faculty_coordinator"),
  listEventParticipants
);
router.get(
  "/event/:eventId/export.csv",
  authorize("admin", "faculty_coordinator"),
  exportParticipantsCsv
);
router.post(
  "/:id/remove",
  authorize("admin", "faculty_coordinator"),
  removeParticipant
);
router.post(
  "/event/:eventId/bulk-remove",
  authorize("admin", "faculty_coordinator"),
  bulkRemoveParticipants
);
router.patch("/:id/revoke-payment", authorize("admin", "faculty_coordinator"), revokeRegistrationPayment);

export default router;

