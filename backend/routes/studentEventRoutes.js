import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  listStudentEvents,
  getStudentEvent,
} from "../controllers/studentEventController.js";

const router = express.Router();

router.use(protect);

router.get("/", listStudentEvents);
router.get("/:id", getStudentEvent);

export default router;
