import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Report from "../models/report.model.js";
import Query from "../models/query.model.js";
import { extractRegionName } from "../services/geocoding.service.js";
import { asyncHandler } from "../utils/error.handler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, "../../uploads/reports");

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * @description Converts an array of Query documents into CSV text. A small
 * hand-rolled formatter is enough here — no extra dependency needed for a
 * handful of known, flat columns.
 * @param {Array} queries
 * @access Private
 */
const toCsv = (queries) => {
  const header = [
    "Date",
    "Query",
    "Region",
    "Phenomenon",
    "Metric",
    "Value",
    "Area Affected (km2)",
    "Change vs Baseline (%)",
    "Confidence (%)",
    "Status",
  ];

  const escape = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;

  const rows = queries.map((q) =>
    [
      q.createdAt.toISOString(),
      q.rawQueryText,
      q.parsedIntent?.region,
      q.parsedIntent?.phenomenon,
      q.satelliteResult?.metric,
      q.satelliteResult?.value,
      q.satelliteResult?.areaAffectedKm2,
      q.satelliteResult?.changeVsBaselinePct,
      q.satelliteResult?.confidence,
      q.status,
    ]
      .map(escape)
      .join(",")
  );

  return [header.map(escape).join(","), ...rows].join("\n");
};

/**
 * @description Generates a real CSV report summarising the current user's
 * query history for a given region (optionally within a date range), writes
 * it to disk, and records it as a Report document. Only CSV is implemented —
 * PDF generation is a genuine TODO, not faked, since it needs a real
 * PDF-rendering step this backend doesn't have wired up yet.
 * @route POST /api/reports/generate
 * @access Private
 */
export const generateReport = asyncHandler(async (req, res) => {
  const { regionName, type = "csv", periodStart, periodEnd } = req.body;

  if (type !== "csv") {
    return res.status(501).json({
      success: false,
      message: "Only CSV reports are implemented right now. PDF export is not built yet.",
    });
  }

  if (!regionName) {
    return res.status(400).json({ success: false, message: "regionName is required" });
  }

  const requestedRegion = regionName
    .trim()
    .replace(/\s+—\s+Query Summary$/i, "")
    .trim();
  const regionPattern = new RegExp(`^${escapeRegex(requestedRegion)}$`, "i");
  const filter = {
    userId: req.user._id,
    $or: [
      { "parsedIntent.region": regionPattern },
      { rawQueryText: regionPattern },
    ],
  };
  if (periodStart || periodEnd) {
    filter.createdAt = {};
    if (periodStart) filter.createdAt.$gte = new Date(periodStart);
    if (periodEnd) filter.createdAt.$lte = new Date(periodEnd);
  }

  const queries = await Query.find(filter).sort({ createdAt: -1 });

  if (queries.length === 0) {
    return res.status(404).json({
      success: false,
      message: `No query history found for region "${requestedRegion}" in that period`,
    });
  }

  const reportRegion =
    extractRegionName(requestedRegion) ||
    queries[0].parsedIntent?.region ||
    requestedRegion;

  const csv = toCsv(queries);
  const filename = `report_${req.user._id}_${Date.now()}.csv`;
  const filePath = path.join(REPORTS_DIR, filename);
  fs.writeFileSync(filePath, csv, "utf-8");

  const fileSizeKb = Math.round(fs.statSync(filePath).size / 1024);

  const report = await Report.create({
    generatedBy: req.user._id,
    title: `${reportRegion} — Query Summary`,
    regionName: reportRegion,
    type: "csv",
    fileUrl: `/uploads/reports/${filename}`, // served as a static file by app.js
    fileSizeKb,
    relatedQueryIds: queries.map((q) => q._id),
    periodStart,
    periodEnd,
  });

  res.status(201).json({ success: true, data: { report } });
});

/**
 * @description Lists reports the current user has generated, most recent
 * first.
 * @route GET /api/reports
 * @access Private
 */
export const listReports = asyncHandler(async (req, res) => {
  const reports = await Report.find({ generatedBy: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { reports } });
});
