import express from "express";
import multer from "multer";
import { protect } from "../middleware/auth.middleware.js";
import { listRemoteAnalyses, runRemoteSensingAnalysis } from "../controllers/remoteSensing.controller.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { files: 2, fileSize: 50 * 1024 * 1024 },
});

router.post("/run", protect, upload.array("images", 2), runRemoteSensingAnalysis);
router.get("/history", protect, listRemoteAnalyses);

export default router;