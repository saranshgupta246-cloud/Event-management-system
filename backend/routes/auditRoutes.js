import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware.js";
import { getAuditLogs, getAuditStats } from "../controllers/auditController.js";

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);

router.get("/", getAuditLogs);
router.get("/stats", getAuditStats);

export default router;
