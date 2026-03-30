import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import * as CC from "../controllers/certificateController.js";
import { updateCertificateCoords } from "../controllers/adminEventController.js";

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

const uploadPDF = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files allowed"));
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
router.post(
  "/events/:eventId/templates",
  protect,
  authorize("admin", "club_leader"),
  uploadPDF.fields([
    { name: "meritTemplate", maxCount: 1 },
    { name: "participationTemplate", maxCount: 1 },
  ]),
  CC.uploadCertificateTemplates
);
router.put(
  "/events/:eventId/certificate-coords",
  protect,
  authorize("admin", "club_leader"),
  updateCertificateCoords
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

router.patch(
  "/:id/revoke",
  protect,
  authorize("admin", "club_leader"),
  CC.revokeCertificate
);

router.delete(
  "/:id",
  protect,
  authorize("admin"),
  CC.deleteCertificateHard
);

export default router;

