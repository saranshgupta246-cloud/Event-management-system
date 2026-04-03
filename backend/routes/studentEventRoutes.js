import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  listStudentEvents,
  getStudentEvent,
  getMyFeedback,
  submitFeedback,
  getEventFeedbackSummary,
} from "../controllers/studentEventController.js";

const router = express.Router();

router.use(protect);

router.get("/", listStudentEvents);
router.get("/:id/feedback/me", getMyFeedback);
router.post("/:id/feedback", submitFeedback);
router.put("/:id/feedback", submitFeedback);
router.get("/:id/feedback/summary", getEventFeedbackSummary);
router.get("/:id", getStudentEvent);

export default router;
