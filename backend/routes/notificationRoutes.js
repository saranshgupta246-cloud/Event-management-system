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
// In production, only admins/club leaders can create notifications.
// In development, allow any authenticated user to create notifications for easier testing.
if (process.env.NODE_ENV === "production") {
  router.post("/", authorize("admin", "club_leader"), createNotification);
} else {
  router.post("/", createNotification);
}
router.patch("/:id/deactivate", authorize("admin"), deactivateNotification);
router.delete("/:id", authorize("admin"), deleteNotification);

export default router;
