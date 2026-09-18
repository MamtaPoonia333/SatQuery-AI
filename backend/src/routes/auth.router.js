import express from "express";
import { register, login, refresh, logout, getMe } from "../controllers/auth.controller.js";
import { validate, registerSchema, loginSchema } from "../validations/auth.validation.js";
import { protect } from "../middleware/auth.middleware.js";

/**
 * @description Router for all /api/auth endpoints. Wires together input
 * validation, controller logic, and auth middleware for each route.
 * @access Public / Private (mixed — see @access on each route below)
 */
const router = express.Router();

/**
 * @description Register a new account.
 * @route POST /api/auth/register
 * @access Public
 */
router.post("/register", validate(registerSchema), register);

/**
 * @description Log in with email + password.
 * @route POST /api/auth/login
 * @access Public
 */
router.post("/login", validate(loginSchema), login);

/**
 * @description Exchange a refresh token for a new access token.
 * @route POST /api/auth/refresh
 * @access Public (requires a valid refresh token)
 */
router.post("/refresh", refresh);

/**
 * @description Log out the current session.
 * @route POST /api/auth/logout
 * @access Private
 */
router.post("/logout", protect, logout);

/**
 * @description Get the currently authenticated user's profile.
 * @route GET /api/auth/me
 * @access Private
 */
router.get("/me", protect, getMe);

export default router;
