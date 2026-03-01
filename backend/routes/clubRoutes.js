import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getAllClubs, getClubBySlug, joinClub, leaveClub } from "../controllers/clubController.js";

const router = express.Router();

router.get("/", getAllClubs);
router.get("/:slug", getClubBySlug);
router.post("/:id/join", protect, joinClub);
router.delete("/:id/leave", protect, leaveClub);

export default router;
