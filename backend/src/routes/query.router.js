import express from "express";
import { submitQuery, listQueries, getQuery } from "../controllers/query.controller.js";
import { validate, submitQuerySchema } from "../validations/query.validation.js";
import { protect } from "../middleware/auth.middleware.js";

/**
 * @description Router for all /api/query endpoints. Every route here requires
 * a logged-in user (see the Explore page in the frontend).
 * @access Private
 */
const router = express.Router();

router.use(protect);

/**
 * @description Submit a new natural-language query for analysis.
 * @route POST /api/query
 * @access Private
 */
router.post("/", validate(submitQuerySchema), submitQuery);

/**
 * @description List the current user's query history.
 * @route GET /api/query
 * @access Private
 */
router.get("/", listQueries);

/**
 * @description Get a single past query by ID.
 * @route GET /api/query/:id
 * @access Private
 */
router.get("/:id", getQuery);

export default router;
