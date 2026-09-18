import Joi from "joi";

/**
 * @description Validation rules for creating a new watched region.
 * @access Public
 */
export const createWatchedRegionSchema = Joi.object({
  regionName: Joi.string().trim().min(2).max(120).required(),
  coordinates: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }).required(),
  phenomenon: Joi.string()
    .valid("flood", "crop_stress", "deforestation", "glacial_lake")
    .required(),
  threshold: Joi.number().required(),
  notificationsEnabled: Joi.boolean().default(true),
});

/**
 * @description Validation rules for updating an existing watched region. All
 * fields optional — only what's provided gets updated.
 * @access Public
 */
export const updateWatchedRegionSchema = Joi.object({
  threshold: Joi.number(),
  notificationsEnabled: Joi.boolean(),
}).min(1);

/**
 * @description Generic middleware factory: validates req.body against a given
 * Joi schema.
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
