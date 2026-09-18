import express from "express";
import { getOverview } from "../controllers/dashboard.controller.js";
import { protect } from "../middleware/auth.middleware.js";

/**
 * @description Router for /api/dashboard endpoints — data that powers the
 * Overview page.
 * @access Private
 */
const router = express.Router();

router.use(protect);

/**
 * @description Get aggregated stats and recent activity for the Overview page.
 * @route GET /api/dashboard/overview
 * @access Private
 */
router.get("/overview", getOverview);

export default router;
