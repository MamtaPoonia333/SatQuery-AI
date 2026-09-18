import express from "express";
import {
  createWatchedRegion,
  listWatchedRegions,
  updateWatchedRegion,
  deleteWatchedRegion,
} from "../controllers/watchedRegion.controller.js";
import {
  validate,
  createWatchedRegionSchema,
  updateWatchedRegionSchema,
} from "../validations/watchedRegion.validation.js";
import { protect } from "../middleware/auth.middleware.js";

/**
 * @description Router for all /api/alerts endpoints (the Alerts page's
 * backing data — monitored regions and their thresholds).
 * @access Private
 */
const router = express.Router();

router.use(protect);

router.post("/", validate(createWatchedRegionSchema), createWatchedRegion);
router.get("/", listWatchedRegions);
router.patch("/:id", validate(updateWatchedRegionSchema), updateWatchedRegion);
router.delete("/:id", deleteWatchedRegion);

export default router;
