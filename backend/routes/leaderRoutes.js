import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  getMyClub,
  approveMember,
  removeMember,
  toggleRecruitment,
} from "../controllers/leaderController.js";

const router = express.Router();

router.use(protect, authorize("club_leader"));

router.get("/club", getMyClub);
router.put("/members/:membershipId/approve", approveMember);
router.delete("/members/:membershipId", removeMember);
router.put("/club/recruitment", toggleRecruitment);

export default router;
