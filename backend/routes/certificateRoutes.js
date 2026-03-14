import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import * as CC from "../controllers/certificateController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PNG/JPG images allowed"));
  },
});

// PUBLIC
router.get("/verify/:verificationId", CC.verifyCertificate);

// STUDENT
router.get("/my", protect, CC.getStudentCertificates);
router.get("/:id/analytics", protect, CC.getCertificateAnalytics);
router.post("/:id/download", protect, CC.downloadCertificate);

// TEMPLATES
router.get("/templates", protect, CC.getTemplates);
router.post("/templates", protect, authorize("admin"), CC.createTemplate);

router.post(
  "/templates/upload",
  protect,
  authorize("admin", "club_leader"),
  upload.single("image"),
  CC.uploadTemplate
);

router.get("/templates/preview", protect, CC.previewTemplate);

// ADMIN + LEADER
router.get(
  "/events/:eventId/eligible",
  protect,
  authorize("admin", "club_leader"),
  CC.getEligibleStudents
);
router.post(
  "/events/:eventId/generate",
  protect,
  authorize("admin", "club_leader"),
  CC.initiateGeneration
);
router.get(
  "/events/:eventId",
  protect,
  authorize("admin", "club_leader"),
  CC.getEventCertificates
);
router.patch(
  "/:id/type",
  protect,
  authorize("admin", "club_leader"),
  CC.updateCertificateType
);

export default router;

