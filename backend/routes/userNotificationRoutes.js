import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  listUserNotifications,
  markOneRead,
  markAllRead,
  getUnreadCount,
} from "../controllers/userNotificationController.js";

const router = express.Router();

router.use(protect);

router.get("/", listUserNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markOneRead);

export default router;
