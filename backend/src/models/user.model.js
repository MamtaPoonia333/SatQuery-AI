import mongoose from "mongoose";

/**
 * @description Mongoose schema for a platform user. Stores identity, hashed
 * credentials, role, and account-security fields (lockout tracking, hashed
 * refresh token). Passwords and tokens are never stored in plain text.
 * @access Private (sensitive fields use `select: false` and are excluded from
 * normal queries by default — see passwordHash and refreshTokenHash below)
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },

    // Never store raw password — bcrypt hash only. `select: false` keeps it
    // out of normal queries; use .select("+passwordHash") when you need it.
    passwordHash: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ["analyst", "admin", "field_unit"],
      default: "analyst",
      // Intentionally NOT settable from public registration input —
      // only an existing admin route should be able to change this.
    },

    organisation: { type: String, trim: true },

    isActive: { type: Boolean, default: true },

    // Hashed refresh token, never the raw token itself.
    refreshTokenHash: { type: String, select: false },

    lastLoginAt: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date },
  },
  { timestamps: true }
);

/**
 * @description The User model, compiled from userSchema. Import this wherever
 * the app needs to read or write user records.
 * @access Public
 */
const User = mongoose.model("User", userSchema);

export default User;
