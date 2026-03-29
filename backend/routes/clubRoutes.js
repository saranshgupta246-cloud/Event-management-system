import express from "express";
import {
  requireAuth,
  requireAdmin,
  requireClubAccessOrAdmin,
  requireCoordinatorOrPresident,
  requireCoordinatorOnly,
  protect,
} from "../middleware/auth.middleware.js";
import {
  validateSchema,
  clubRoutesCreateClubSchema,
  clubRoutesUpdateClubSchema,
  clubRoutesAddMemberSchema,
  clubRoutesUpdateMemberRoleSchema,
} from "../middleware/validate.js";
import {
  createClub,
  listClubs,
  getClubById,
  checkNameAvailability,
  updateClub,
  deleteClub,
  addMember,
  listMembers,
  updateMemberRole,
  removeMember,
  getMemberRoleHistory,
  searchUsersForClub,
} from "../controllers/clubsController.js";
import { getClubBySlug, joinClub, leaveClub } from "../controllers/clubController.js";
import {
  createLeaderInvite,
  listInvitesForClub,
  revokeInvite,
  acceptInvite,
} from "../controllers/joinInvitesController.js";
import {
  createClubEvent,
  listClubEvents,
  updateClubEvent,
  deleteClubEvent,
} from "../controllers/clubEventController.js";
import { clubDrivesRouter } from "./recruitmentRoutes.js";
import { cacheMiddleware } from "../middleware/cache.middleware.js";
import {
  uploadClubLogoById,
  uploadClubBannerById,
} from "../controllers/adminClubController.js";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

router.post("/", requireAuth, requireAdmin, validateSchema(clubRoutesCreateClubSchema), createClub);

// Cache anonymous club listing (homepage etc.) for 120s.
router.get("/", cacheMiddleware(120), listClubs);
router.get("/check-name", checkNameAvailability);
router.get("/by-slug/:slug", getClubBySlug);
router.get("/:clubId", getClubById);
router.post("/:id/join", protect, joinClub);
router.delete("/:id/leave", protect, leaveClub);

// Invite-based join flow
router.post(
  "/:clubId/invites",
  requireAuth,
  requireClubAccessOrAdmin(2),
  createLeaderInvite
);
router.get(
  "/:clubId/invites",
  requireAuth,
  requireClubAccessOrAdmin(4),
  listInvitesForClub
);
router.patch(
  "/:clubId/invites/:inviteId/revoke",
  requireAuth,
  requireClubAccessOrAdmin(2),
  revokeInvite
);
router.post(
  "/:clubId/join-with-token",
  requireAuth,
  acceptInvite
);

router.patch(
  "/:clubId",
  requireAuth,
  requireClubAccessOrAdmin(1),
  validateSchema(clubRoutesUpdateClubSchema),
  updateClub
);

router.delete("/:clubId", requireAuth, requireAdmin, deleteClub);

router.post(
  "/:clubId/members",
  requireAuth,
  requireClubAccessOrAdmin(2),
  validateSchema(clubRoutesAddMemberSchema),
  addMember
);

router.get("/:clubId/members", requireAuth, requireClubAccessOrAdmin(6), listMembers);

router.get(
  "/:clubId/members/search-users",
  requireAuth,
  requireClubAccessOrAdmin(2),
  searchUsersForClub
);

router.patch(
  "/:clubId/members/:memberId/role",
  requireAuth,
  requireClubAccessOrAdmin(2),
  validateSchema(clubRoutesUpdateMemberRoleSchema),
  updateMemberRole
);

router.delete("/:clubId/members/:memberId", requireAuth, requireClubAccessOrAdmin(2), removeMember);

router.get(
  "/:clubId/members/:memberId/role-history",
  requireAuth,
  requireClubAccessOrAdmin(4),
  getMemberRoleHistory
);

// Club events - Coordinator or President can create/update, Coordinator only can delete
router.get("/:clubId/events", listClubEvents);
router.post("/:clubId/events", requireAuth, requireCoordinatorOrPresident("clubId"), createClubEvent);
router.patch("/:clubId/events/:eventId", requireAuth, requireCoordinatorOrPresident("clubId"), updateClubEvent);
router.delete("/:clubId/events/:eventId", requireAuth, requireCoordinatorOnly("clubId"), deleteClubEvent);

router.use("/:clubId/drives", clubDrivesRouter);

router.patch(
  "/:clubId/logo",
  requireAuth,
  requireClubAccessOrAdmin(1),
  upload.single("logo"),
  uploadClubLogoById
);

router.patch(
  "/:clubId/banner",
  requireAuth,
  requireClubAccessOrAdmin(1),
  upload.single("banner"),
  uploadClubBannerById
);

export default router;
