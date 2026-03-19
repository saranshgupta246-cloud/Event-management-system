import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getMe } from "../controllers/authController.js";

const router = express.Router();

router.get("/me", protect, getMe);

export default router;
