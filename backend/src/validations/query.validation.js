import Joi from "joi";

/**
 * @description Validation rules for submitting a new query.
 * @access Public
 */
export const submitQuerySchema = Joi.object({
  rawQueryText: Joi.string().trim().min(3).max(500).required(),
});

/**
 * @description Generic middleware factory: validates req.body against a given
 * Joi schema, stripping unknown fields and returning a 400 with readable
 * messages on failure.
 * @param {import("joi").ObjectSchema} schema
 * @access Public
 */
export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
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
