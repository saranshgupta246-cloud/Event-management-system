import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { firebaseExchange, getMe, login, register } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/firebase", firebaseExchange);
router.get("/me", protect, getMe);

export default router;
