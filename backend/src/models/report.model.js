import mongoose from "mongoose";

/**
 * @description Mongoose schema for a generated report (e.g. a CSV export of a
 * region's recent query history). The actual file lives on disk (or cloud
 * storage in production) — only its path/URL is stored here.
 * @access Private
 */
const reportSchema = new mongoose.Schema(
  {
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: { type: String, required: true, trim: true },
    regionName: { type: String, required: true },

    type: { type: String, enum: ["csv"], required: true },
    // Note: only CSV generation is actually implemented right now. A "pdf"
    // option is intentionally left out rather than faked — see
    // report.controller.js for why.

    fileUrl: { type: String, required: true },
    fileSizeKb: { type: Number },

    relatedQueryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Query" }],
    periodStart: { type: Date },
    periodEnd: { type: Date },
  },
  { timestamps: true }
);

reportSchema.index({ generatedBy: 1, createdAt: -1 });

const Report = mongoose.model("Report", reportSchema);

export default Report;
