import mongoose from "mongoose";

/**
 * @description Mongoose schema for a region a user is monitoring for a
 * specific phenomenon (flood, crop stress, etc). Backs the Alerts page —
 * riskLevel is what turns a watched region into a visible "alert".
 * @access Private
 */
const watchedRegionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    regionName: { type: String, required: true, trim: true },
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },

    phenomenon: {
      type: String,
      enum: ["flood", "crop_stress", "deforestation", "glacial_lake"],
      required: true,
    },

    // Meaning depends on `phenomenon`: km² affected for flood, NDVI drop for
    // crop_stress, % canopy loss for deforestation, % growth for glacial_lake.
    threshold: { type: Number, required: true },

    lastCheckedValue: { type: Number },
    lastCheckedAt: { type: Date },

    notificationsEnabled: { type: Boolean, default: true },
    riskLevel: {
      type: String,
      enum: ["normal", "watch", "critical"],
      default: "normal",
    },
  },
  { timestamps: true }
);

watchedRegionSchema.index({ userId: 1 });

const WatchedRegion = mongoose.model("WatchedRegion", watchedRegionSchema);

export default WatchedRegion;
