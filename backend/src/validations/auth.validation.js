import Joi from "joi";

// Note: `role` is deliberately NOT part of the public registration schema.
// Allowing a client to set their own role would let anyone sign up as
// "admin". Every new signup is forced to the default role in the
// controller; promoting a user to admin should happen through a separate,
// admin-protected endpoint later.

/**
 * @description Validation rules for the register (signup) request body. Enforces
 * a minimum-strength password and strips any field not explicitly listed here.
 * @access Public
 */
export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),

  email: Joi.string().trim().lowercase().email().required(),

  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
    }),

  organisation: Joi.string().trim().max(120).allow("", null),
});

/**
 * @description Validation rules for the login request body.
 * @access Public
 */
export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});

/**
 * @description Generic middleware factory that validates req.body against a
 * given Joi schema before the request reaches the controller. On failure it
 * responds with 400 and a list of human-readable error messages; on success
 * it replaces req.body with the sanitised, validated value.
 * @param {import("joi").ObjectSchema} schema - The Joi schema to validate against.
 * @access Public
 */
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true, // silently drops fields like `role` if someone sends them
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.details.map((d) => d.message),
    });
  }

  req.body = value;
  next();
};
