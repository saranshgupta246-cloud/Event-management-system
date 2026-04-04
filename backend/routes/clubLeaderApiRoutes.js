import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.middleware.js";
import { requireCoordinator } from "../middleware/roleMiddleware.js";
import { uploadEventImage, uploadEventQr } from "../controllers/adminEventController.js";
import {
  getMyClub,
  approveMember,
  removeMember,
  toggleRecruitment,
} from "../controllers/coordinatorController.js";
import {
  getMyClubMembers,
  listCoordinatorEvents,
  updateMemberClubRole,
  addMemberToClub,
  removeMember as removeClubMember,
  getMemberRoleHistory,
  searchUsersForCoordinatorClub,
  reactivateMember,
  importMembersFromCSV,
} from "../controllers/clubCoordinatorController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// faculty_coordinator or admin — mounted at /api/coordinator and /api/leader
router.use(protect, requireCoordinator);

router.post("/events/image", upload.single("image"), uploadEventImage);
router.post("/events/qr", upload.single("image"), uploadEventQr);
router.get("/events", listCoordinatorEvents);
router.get("/club", getMyClub);
router.get("/club/members", getMyClubMembers);
router.get("/club/members/search-users", searchUsersForCoordinatorClub);
router.post("/club/members", addMemberToClub);
router.post("/club/members/import-csv", upload.single("csv"), importMembersFromCSV);
router.patch("/club/members/:memberId/role", updateMemberClubRole);
router.patch("/club/members/:memberId/reactivate", reactivateMember);
router.delete("/club/members/:memberId", removeClubMember);
router.get("/club/members/:memberId/role-history", getMemberRoleHistory);

router.put("/members/:membershipId/approve", approveMember);
router.delete("/members/:membershipId", removeMember);
router.put("/club/recruitment", toggleRecruitment);

export default router;
