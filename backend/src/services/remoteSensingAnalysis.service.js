import path from "path";
import sharp from "sharp";
import { analyzeImagesWithVision } from "./llm.service.js";

const specialistRegistry = {
  single: {
    vqa: "remote-sensing-vqa-baseline",
    caption: "remote-sensing-caption-baseline",
    grounding: "spectral-grounding-baseline",
  },
  temporal: {
    change: "multitemporal-change-baseline",
  },
  crossModal: {
    fusion: "optical-sar-fusion-baseline",
  },
};

const getExtension = (filename) => path.extname(filename).toLowerCase();

const summarizeImage = async (file) => {
  const metadata = await sharp(file.buffer).metadata();
  const stats = await sharp(file.buffer).stats();

  return {
    name: file.originalname,
    format: metadata.format,
    width: metadata.width || null,
    height: metadata.height || null,
    channels: metadata.channels || null,
    space: metadata.space || null,
    sizeBytes: file.size,
    mean: Number(stats.channels?.[0]?.mean?.toFixed(4) || 0),
    standardDeviation: Number(
      stats.channels?.[0]?.stdev?.toFixed(4) || 0
    ),
  };
};

const chooseTask = (mode, task) => {
  const normalized = task.toLowerCase();

  if (mode === "temporal") return "change-understanding";
  if (mode === "cross-modal") return "optical-sar-fusion";
  if (normalized.includes("highlight") || normalized.includes("where")) {
    return "region-grounding";
  }
  if (normalized.includes("describe") || normalized.includes("caption")) {
    return "scene-captioning";
  }
  return "single-image-vqa";
};

const adaptRemoteSensingSignals = (images) => images.map((image) => ({
  image: image.name,
  normalizedMean: Number((image.mean / 255).toFixed(4)),
  textureSignal: Number((image.standardDeviation / 255).toFixed(4)),
  adaptation: "sensor-aware channel normalization",
}));

const runSingleImageTool = (images, task) => {
  const image = images[0];
  const taskName = chooseTask("single", task);
  const evidence = {
    image: image.name,
    imageExtent: [0, 0, 1, 1],
    note: "The baseline adapter exposes the full image extent; trained grounding weights can replace this tool.",
  };

  if (taskName === "region-grounding") {
    return {
      answer: `The requested target should be reviewed across the full ${image.width}x${image.height} image extent.`,
      confidence: 42,
      evidence,
    };
  }

  if (taskName === "scene-captioning") {
    return {
      answer: `Remote-sensing scene captured at ${image.width}x${image.height} with ${image.channels} channel(s). Mean channel intensity is ${image.mean}.`,
      confidence: 45,
      evidence,
    };
  }

  return {
    answer: `The image is available for remote-sensing VQA at ${image.width}x${image.height}. The baseline adapter measured mean channel intensity ${image.mean}; semantic answers require the adapted VQA model.`,
    confidence: 40,
    evidence,
  };
};

const runTemporalTool = (images, task) => {
  const [before, after] = images;
  const delta = Number((after.mean - before.mean).toFixed(4));
  const magnitude = Math.min(1, Math.abs(delta) / 255);
  const direction = delta > 0.01 ? "increased" : delta < -0.01 ? "decreased" : "remained stable";

  return {
    answer: `The baseline comparison indicates that image intensity ${direction} between ${before.name} and ${after.name} (delta ${delta}). This is a screening signal, not a semantic change label.`,
    confidence: Math.round(35 + magnitude * 40),
    evidence: {
      before: before.name,
      after: after.name,
      intensityDelta: delta,
      normalizedChangeScore: Number(magnitude.toFixed(4)),
      changeMap: null,
    },
  };
};

const runCrossModalTool = (images, task, roles = []) => {
  const optical = images[roles.indexOf("optical")] || images.find((image) => /optical|multispectral|sentinel/i.test(image.name));
  const sar = images[roles.indexOf("sar")] || images.find((image) => /sar|radar|risat/i.test(image.name));
  const [first, second] = images;

  return {
    answer: `The optical-SAR baseline paired ${optical?.name || first.name} with ${sar?.name || second.name}. Optical imagery contributes spectral context and SAR contributes structure; a trained fusion model is required for reliable class-level extraction.`,
    confidence: optical && sar ? 48 : 30,
    evidence: {
      optical: optical?.name || first.name,
      sar: sar?.name || second.name,
      modalitiesDetected: Boolean(optical && sar),
      fusionMap: null,
    },
  };
};

export const analyzeRemoteSensingInput = async ({ files, mode, task, roles }) => {
  const images = await Promise.all(files.map(summarizeImage));
  const selectedTask = chooseTask(mode, task);
  const visionResult = await analyzeImagesWithVision({ files, mode, task, roles });
  const result =
    mode === "temporal"
      ? runTemporalTool(images, task)
      : mode === "cross-modal"
        ? runCrossModalTool(images, task, roles)
        : runSingleImageTool(images, task);

  const resultPayload = {
    mode,
    task: selectedTask,
    answer: result.answer,
    confidence: result.confidence,
    images,
    evidence: result.evidence,
    adaptedFeatures: adaptRemoteSensingSignals(images),
    executionTrace: [
      { step: 1, tool: "input-validator", status: "completed", parameters: { mode, imageCount: files.length, roles } },
      { step: 2, tool: "agentic-task-router", status: "completed", parameters: { selectedTask } },
      { step: 3, tool: "remote-sensing-domain-adapter", status: "completed", parameters: { normalization: "channel mean/std" } },
      { step: 4, tool: specialistRegistry[mode === "cross-modal" ? "crossModal" : mode][mode === "single" ? selectedTask === "region-grounding" ? "grounding" : selectedTask === "scene-captioning" ? "caption" : "vqa" : mode === "temporal" ? "change" : "fusion"], status: "completed", parameters: { task, roles } },
    ],
    modelStatus: "baseline-adapter",
    modelNote: "Vision analysis was unavailable; the result uses image statistics only.",
  };

  if (visionResult) {
    return {
      ...resultPayload,
      answer: visionResult.answer,
      confidence: visionResult.confidence,
      evidence: {
        ...resultPayload.evidence,
        observations: visionResult.observations,
        limitations: visionResult.limitations,
      },
      executionTrace: resultPayload.executionTrace.map((step) =>
        step.tool.endsWith("-baseline")
          ? { ...step, tool: `${step.tool.replace("-baseline", "")}-groq-vision` }
          : step
      ),
      modelStatus: "groq-vision-adapter",
      modelNote: `Image-grounded analysis generated by ${visionResult.model}.`,
    };
  }

  return resultPayload;
};

export const allowedExtensions = new Set([".tif", ".tiff", ".png", ".jpg", ".jpeg"]);

export const validateUploadedFiles = async (files, mode, roles = []) => {
  const expectedCount = mode === "single" ? 1 : 2;
  if (!files || files.length !== expectedCount) {
    throw new Error(`${mode} analysis requires exactly ${expectedCount} image${expectedCount > 1 ? "s" : ""}.`);
  }

  for (const file of files) {
    if (!allowedExtensions.has(getExtension(file.originalname))) {
      throw new Error(`${file.originalname} is unsupported. Use GeoTIFF, TIFF, PNG, or JPEG.`);
    }
  }

  const metadata = await Promise.all(files.map((file) => sharp(file.buffer).metadata()));
  if (mode !== "single" && (metadata[0].width !== metadata[1].width || metadata[0].height !== metadata[1].height)) {
    throw new Error("Paired images must have matching width and height for co-registered analysis.");
  }

  if (mode === "cross-modal" && (!roles.includes("optical") || !roles.includes("sar") || roles.length !== 2)) {
    throw new Error("Cross-modal analysis requires one optical/multispectral file and one SAR file.");
  }
};