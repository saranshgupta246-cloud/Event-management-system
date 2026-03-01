import express from "express";
import { body, param } from "express-validator";
import {
  requireAuth,
  requireAdmin,
  requireClubAccess,
  requireClubAccessOrAdmin,
} from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
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
  MEMBER_ROLES,
  CLUB_CATEGORIES,
} from "../controllers/clubs.controller.js";
import { clubDrivesRouter } from "./recruitment.routes.js";

const router = express.Router();

const createClubValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("category")
    .isIn(CLUB_CATEGORIES)
    .withMessage("Category must be one of: " + CLUB_CATEGORIES.join(", ")),
  body("description").optional(),
  body("logoUrl").optional(),
  body("bannerUrl").optional(),
];

const updateClubValidation = [
  body("name").optional().trim().notEmpty(),
  body("category").optional().isIn(CLUB_CATEGORIES),
  body("description").optional(),
  body("logoUrl").optional(),
  body("bannerUrl").optional(),
  body("status").optional().isIn(["active", "inactive"]),
];

const addMemberValidation = [
  body("userId").isMongoId().withMessage("Valid user ID is required"),
  body("role").isIn(MEMBER_ROLES).withMessage("Role must be one of: " + MEMBER_ROLES.join(", ")),
];

const updateMemberRoleValidation = [
  body("role").isIn(MEMBER_ROLES).withMessage("Role must be one of: " + MEMBER_ROLES.join(", ")),
  body("reason").optional(),
];

router.post("/", requireAuth, requireAdmin, createClubValidation, validate, createClub);

router.get("/", listClubs);
router.get("/check-name", checkNameAvailability);
router.get("/:clubId", getClubById);

router.patch(
  "/:clubId",
  requireAuth,
  requireClubAccessOrAdmin(1),
  updateClubValidation,
  validate,
  updateClub
);

router.delete("/:clubId", requireAuth, requireAdmin, deleteClub);

router.post(
  "/:clubId/members",
  requireAuth,
  requireClubAccessOrAdmin(2),
  addMemberValidation,
  validate,
  addMember
);

router.get("/:clubId/members", requireAuth, requireClubAccess(6), listMembers);

router.get(
  "/:clubId/members/search-users",
  requireAuth,
  requireClubAccess(2),
  searchUsersForClub
);

router.patch(
  "/:clubId/members/:memberId/role",
  requireAuth,
  requireClubAccess(2),
  updateMemberRoleValidation,
  validate,
  updateMemberRole
);

router.delete("/:clubId/members/:memberId", requireAuth, requireClubAccess(2), removeMember);

router.get(
  "/:clubId/members/:memberId/role-history",
  requireAuth,
  requireClubAccess(4),
  getMemberRoleHistory
);

router.use("/:clubId/drives", clubDrivesRouter);

export default router;
