import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createRegistration, getMyRegistrations } from "../controllers/registrationController.js";

const router = express.Router();

router.use(protect);

router.post("/", createRegistration);
router.get("/my", getMyRegistrations);

export default router;

