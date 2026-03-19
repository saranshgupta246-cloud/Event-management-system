import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  getMyClub,
  approveMember,
  removeMember,
  toggleRecruitment,
} from "../controllers/leaderController.js";
import {
  getMyClubMembers,
  updateMemberClubRole,
  addMemberToClub,
  removeMember as removeClubMember,
  getMemberRoleHistory,
  searchUsersForLeaderClub,
  reactivateMember,
} from "../controllers/clubLeaderController.js";

const router = express.Router();

// auth.middleware.normalizeRole maps db role \"club_leader\" -> \"leader\"
// so we authorize against the normalized value here.
router.use(protect, authorize("leader"));

router.get("/club", getMyClub);
router.get("/club/members", getMyClubMembers);
router.get("/club/members/search-users", searchUsersForLeaderClub);
router.post("/club/members", addMemberToClub);
router.patch("/club/members/:memberId/role", updateMemberClubRole);
router.patch("/club/members/:memberId/reactivate", reactivateMember);
router.delete("/club/members/:memberId", removeClubMember);
router.get("/club/members/:memberId/role-history", getMemberRoleHistory);

router.put("/members/:membershipId/approve", approveMember);
router.delete("/members/:membershipId", removeMember);
router.put("/club/recruitment", toggleRecruitment);

export default router;
