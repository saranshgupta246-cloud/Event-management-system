import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.middleware.js";
import {
  getMyProfile,
  updateMyProfile,
  uploadAvatarImage,
} from "../controllers/profileController.js";

const router = express.Router();

// In-memory storage — we stream directly to Cloudinary; no disk writes
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

router.use(protect);

router.get("/me", getMyProfile);
router.put("/me", updateMyProfile);
router.post("/avatar", upload.single("avatar"), uploadAvatarImage);

export default router;
