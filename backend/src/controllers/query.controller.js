import Query from "../models/query.model.js";
import { analyzeQuery } from "../services/aiPipeline.service.js";
import { asyncHandler } from "../utils/error.handler.js";

/**
 * @description Submits a new natural-language query, runs it through the full
 * AI pipeline (LLM intent extraction → geocoding → Sentinel Hub → Pinecone
 * RAG → LLM answer composition, each with graceful fallback — see
 * aiPipeline.service.js), saves the full result against the authenticated
 * user, and returns it.
 * @route POST /api/query
 * @access Private
 */
export const submitQuery = asyncHandler(async (req, res) => {
  const { rawQueryText } = req.body;

  const analysis = await analyzeQuery(rawQueryText);

  const query = await Query.create({
    userId: req.user._id,
    rawQueryText,
    parsedIntent: analysis.parsedIntent,
    satelliteResult: analysis.satelliteResult,
    responseText: analysis.responseText,
    status: analysis.status,
    vectorId: analysis.vectorId || undefined,
  });

  res.status(201).json({
    success: true,
    data: {
      query,
      // Surfaced for debugging/demo purposes — shows which layers actually
      // fired for this request vs. which ones fell back.
      meta: {
        usedRealSatelliteData: analysis.usedRealSatelliteData,
        usedRAGContext: analysis.usedRAGContext,
        pineconeStored: analysis.pineconeStored,
      },
    },
  });
});

/**
 * @description Lists the authenticated user's past queries, most recent
 * first, with simple pagination via ?page and ?limit query params.
 * @route GET /api/query
 * @access Private
 */
export const listQueries = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);

  const [queries, total] = await Promise.all([
    Query.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Query.countDocuments({ userId: req.user._id }),
  ]);

  res.status(200).json({
    success: true,
    data: { queries, total, page, pages: Math.ceil(total / limit) },
  });
});

/**
 * @description Fetches a single query by ID, scoped to the authenticated user
 * (a user cannot read another user's query by guessing its ID).
 * @route GET /api/query/:id
 * @access Private
 */
export const getQuery = asyncHandler(async (req, res) => {
  const query = await Query.findOne({ _id: req.params.id, userId: req.user._id });

  if (!query) {
    return res.status(404).json({ success: false, message: "Query not found" });
  }

  res.status(200).json({ success: true, data: { query } });
});
