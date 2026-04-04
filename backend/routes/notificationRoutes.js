import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  listNotifications,
  markRead,
  markAllRead,
  createNotification,
  deleteNotification,
  deactivateNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.use(protect);

router.get("/", listNotifications);
router.post("/read-all", markAllRead);
router.post("/:id/read", markRead);
router.post("/", authorize("admin", "faculty_coordinator"), createNotification);
router.patch("/:id/deactivate", authorize("admin", "faculty_coordinator"), deactivateNotification);
router.delete("/:id", authorize("admin", "faculty_coordinator"), deleteNotification);

export default router;
