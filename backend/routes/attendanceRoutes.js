import express from "express";
import { z } from "zod";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateSchema } from "../middleware/validate.js";
import {
  getEventAttendance,
  scanAttendance,
  manualMarkAttendance,
  exportAttendanceCsv,
} from "../controllers/attendanceController.js";

const router = express.Router();

const scanSchema = z.object({
  qrCodeToken: z.string().min(1, "qrCodeToken is required"),
});

router.use(protect, authorize("admin", "club_leader"));

router.get("/event/:eventId", getEventAttendance);
router.post("/scan", validateSchema(scanSchema), scanAttendance);
router.put("/manual/:registrationId", manualMarkAttendance);
router.get("/export/:eventId", exportAttendanceCsv);

export default router;

