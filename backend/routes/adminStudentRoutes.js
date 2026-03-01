import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import {
  listStudents,
  getStudentById,
  updateStudentById,
} from "../controllers/adminStudentController.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/", listStudents);
router.get("/:id", getStudentById);
router.put("/:id", updateStudentById);

export default router;

