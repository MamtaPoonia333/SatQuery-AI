import mongoose from "mongoose";

/**
 * @description Mongoose schema for a single satellite query made by a user —
 * stores what was asked, what region/phenomenon was parsed out of it, and the
 * resulting analysis (metric values, confidence, etc.).
 * @access Private
 */
const querySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rawQueryText: { type: String, required: true, trim: true },

    parsedIntent: {
      region: { type: String },
      phenomenon: {
        type: String,
        enum: ["flood", "crop_stress", "deforestation", "glacial_lake", "unknown"],
        default: "unknown",
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    // Reserved for when the LangChain + Pinecone layer is wired in — this
    // will hold the Pinecone vector ID for this query's embedding so past
    // similar queries can be retrieved for RAG context. Unused for now.
    vectorId: { type: String },

    satelliteResult: {
      passTimestamp: Date,
      source: { type: String, default: "Sentinel-2 L2A (simulated)" },
      metric: { type: String },
      value: { type: Number },
      areaAffectedKm2: { type: Number },
      changeVsBaselinePct: { type: Number },
      confidence: { type: Number, min: 0, max: 100 },
    },

    responseText: { type: String },

    status: {
      type: String,
      enum: ["resolved", "low_confidence", "failed"],
      default: "resolved",
    },
  },
  { timestamps: true }
);

querySchema.index({ userId: 1, createdAt: -1 });

const Query = mongoose.model("Query", querySchema);

export default Query;
