import mongoose from "mongoose";

const remoteAnalysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    mode: { type: String, enum: ["single", "temporal", "cross-modal"], required: true },
    task: { type: String, required: true },
    answer: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 100, required: true },
    images: [{ type: mongoose.Schema.Types.Mixed }],
    evidence: { type: mongoose.Schema.Types.Mixed },
    adaptedFeatures: [{ type: mongoose.Schema.Types.Mixed }],
    executionTrace: [{ type: mongoose.Schema.Types.Mixed }],
    modelStatus: { type: String },
    modelNote: { type: String },
  },
  { timestamps: true }
);

remoteAnalysisSchema.index({ userId: 1, createdAt: -1 });

const RemoteAnalysis = mongoose.model("RemoteAnalysis", remoteAnalysisSchema);

export default RemoteAnalysis;