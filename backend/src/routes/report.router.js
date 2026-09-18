import express from "express";
import { generateReport, listReports } from "../controllers/report.controller.js";
import { protect } from "../middleware/auth.middleware.js";

/**
 * @description Router for all /api/reports endpoints.
 * @access Private
 */
const router = express.Router();

router.use(protect);

/**
 * @description Generate a new CSV report for a region.
 * @route POST /api/reports/generate
 * @access Private
 */
router.post("/generate", generateReport);

/**
 * @description List previously generated reports.
 * @route GET /api/reports
 * @access Private
 */
router.get("/", listReports);

export default router;
