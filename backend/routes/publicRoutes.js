import express from "express";
import { getPublicStats, getPublicEvents } from "../controllers/publicController.js";
import { cacheMiddleware } from "../middleware/cache.middleware.js";

const router = express.Router();

// Cache public stats for 120s and events for 60s
router.get("/stats", cacheMiddleware(120), getPublicStats);
router.get("/events", cacheMiddleware(60), getPublicEvents);

export default router;

