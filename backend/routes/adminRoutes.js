import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  validateSchema,
  createClubSchema,
  updateClubSchema,
  createEventSchema,
  updateEventSchema,
} from "../middleware/validate.js";
import {
  createClub,
  updateClub,
  deleteClub,
  assignCoordinator,
  removeCoordinator,
  uploadClubLogo,
  uploadClubBanner,
  bulkImportClubs,
  searchUsersForCoordinator,
} from "../controllers/adminClubController.js";
import { searchUsers } from "../controllers/adminUserController.js";
import {
  listAdminEvents,
  getAdminEventById,
  createAdminEvent,
  updateAdminEvent,
  deleteAdminEvent,
  uploadEventImage,
  uploadEventQr,
} from "../controllers/adminEventController.js";
import { getOverview } from "../controllers/adminDashboardController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(protect, authorize("admin"));

router.get("/dashboard/overview", getOverview);
router.get("/users", searchUsers);
router.get("/users/search-coordinator", searchUsersForCoordinator);
router.post("/clubs", validateSchema(createClubSchema), createClub);
router.post("/clubs/bulk-import", authorize("admin"), upload.single("csv"), bulkImportClubs);
router.put("/clubs/:id", validateSchema(updateClubSchema), updateClub);
router.delete("/clubs/:id", deleteClub);
router.put("/clubs/:id/assign-coordinator", assignCoordinator);
router.delete("/clubs/:id/coordinator", authorize("admin"), removeCoordinator);
router.post(
  "/clubs/logo",
  authorize("admin"),
  upload.single("logo"),
  uploadClubLogo
);
router.post(
  "/clubs/banner",
  authorize("admin"),
  upload.single("banner"),
  uploadClubBanner
);
router.get("/events", listAdminEvents);
router.get("/events/:id", getAdminEventById);
router.post("/events", validateSchema(createEventSchema), createAdminEvent);
router.put("/events/:id", validateSchema(updateEventSchema), updateAdminEvent);
router.delete("/events/:id", deleteAdminEvent);
router.post(
  "/events/image",
  authorize("admin"),
  upload.single("image"),
  uploadEventImage
);
router.post(
  "/events/qr",
  authorize("admin"),
  upload.single("image"),
  uploadEventQr
);

export default router;
