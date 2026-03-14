import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  validateSchema,
  createClubSchema,
  updateClubSchema,
  assignLeaderSchema,
  createEventSchema,
  updateEventSchema,
} from "../middleware/validate.js";
import {
  createClub,
  updateClub,
  deleteClub,
  assignLeader,
} from "../controllers/adminClubController.js";
import { searchUsers } from "../controllers/adminUserController.js";
import {
  listAdminEvents,
  createAdminEvent,
  updateAdminEvent,
  deleteAdminEvent,
  uploadEventImage,
} from "../controllers/adminEventController.js";
import { getOverview } from "../controllers/adminDashboardController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// TEMP: allow any authenticated user to access admin routes (no role check)
// To re-enable admin-only access, change this back to:
// router.use(protect, authorize("admin"));
router.use(protect);

router.get("/dashboard/overview", getOverview);
router.get("/users", searchUsers);
router.post("/clubs", validateSchema(createClubSchema), createClub);
    router.put("/clubs/:id", validateSchema(updateClubSchema), updateClub);
router.delete("/clubs/:id", deleteClub);
router.put("/clubs/:id/assign-leader", validateSchema(assignLeaderSchema), assignLeader);
router.get("/events", listAdminEvents);
router.post("/events", validateSchema(createEventSchema), createAdminEvent);
    router.put("/events/:id", validateSchema(updateEventSchema), updateAdminEvent);
router.delete("/events/:id", deleteAdminEvent);
router.post(
  "/events/image",
  authorize("admin"),
  upload.single("image"),
  uploadEventImage
);

export default router;
