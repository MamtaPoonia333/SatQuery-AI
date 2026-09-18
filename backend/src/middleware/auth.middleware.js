import jwt from "jsonwebtoken";
import config from "../config/config.js";
import User from "../models/user.model.js";
import { isTokenBlocklisted } from "../services/tokenBlocklist.service.js";

/**
 * @description Verifies the Bearer access token on the Authorization header,
 * rejects it if it has been blocklisted in Redis (i.e. the user already
 * logged out with this specific token), and attaches the corresponding user
 * document (minus sensitive fields) to req.user. Also attaches the decoded
 * token payload to req.tokenPayload so downstream handlers (like logout)
 * can read its jti/exp without re-verifying the token themselves.
 * @access Private
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized — no token provided",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      const message =
        err.name === "TokenExpiredError"
          ? "Session expired — please log in again"
          : "Invalid token";
      return res.status(401).json({ success: false, message });
    }

    // Redis-backed blocklist: catches tokens explicitly invalidated by
    // logout, even though their JWT signature is still technically valid.
    // Fails open (treats as not-blocklisted) if Redis isn't configured or
    // reachable — see tokenBlocklist.service.js for why.
    const blocked = await isTokenBlocklisted(decoded.jti);
    if (blocked) {
      return res.status(401).json({
        success: false,
        message: "This session has been logged out — please log in again",
      });
    }

    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account not found or has been deactivated",
      });
    }

    req.user = user; // full mongoose doc, passwordHash excluded by schema `select: false`
    req.tokenPayload = decoded; // { id, jti, iat, exp } — used by logout to blocklist this exact token
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * @description Restricts a route to specific roles. Must be used after
 * `protect`, since it relies on req.user already being set.
 * @param {...string} allowedRoles - Roles permitted to access the route, e.g. "admin".
 * @access Private
 * @example router.delete("/users/:id", protect, authorize("admin"), deleteUser);
 */
export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
