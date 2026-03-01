import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  listEventMessages,
  sendEventMessage,
  getEventParticipants,
  deleteEventMessage,
  updateChatSettings,
} from "../controllers/chatController.js";

const router = express.Router();

router.use(protect);

router.get("/:eventId", listEventMessages);
router.post("/:eventId", sendEventMessage);
router.delete("/:eventId/:messageId", deleteEventMessage);
router.get("/:eventId/participants", getEventParticipants);
router.patch("/:eventId/settings", updateChatSettings);

export default router;

