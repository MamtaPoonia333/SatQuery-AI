import { asyncHandler } from "../utils/error.handler.js";
import RemoteAnalysis from "../models/remoteAnalysis.model.js";
import {
  analyzeRemoteSensingInput,
  validateUploadedFiles,
} from "../services/remoteSensingAnalysis.service.js";

const validModes = new Set(["single", "temporal", "cross-modal"]);

export const runRemoteSensingAnalysis = asyncHandler(async (req, res) => {
  const mode = req.body.mode || "single";
  const task = String(req.body.task || "Describe this remote-sensing image.").trim();
  let roles = [];
  try {
    roles = req.body.roles ? JSON.parse(req.body.roles) : [];
  } catch {
    return res.status(400).json({ success: false, message: "roles must be valid JSON" });
  }

  if (!validModes.has(mode)) {
    return res.status(400).json({ success: false, message: "mode must be single, temporal, or cross-modal" });
  }

  try {
    await validateUploadedFiles(req.files, mode, roles);
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  const analysis = await analyzeRemoteSensingInput({ files: req.files, mode, task, roles });
  const saved = await RemoteAnalysis.create({ userId: req.user._id, ...analysis });
  res.status(200).json({ success: true, data: { ...analysis, analysisId: saved._id } });
});

export const listRemoteAnalyses = asyncHandler(async (req, res) => {
  const analyses = await RemoteAnalysis.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);
  res.status(200).json({ success: true, data: { analyses } });
});