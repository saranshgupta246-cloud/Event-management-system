import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  listStudents,
  getStudentById,
  updateStudentById,
  exportStudentsCsv,
} from "../controllers/adminStudentController.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/export.csv", exportStudentsCsv);
router.get("/", listStudents);
router.get("/:id", getStudentById);
router.put("/:id", updateStudentById);

export default router;

