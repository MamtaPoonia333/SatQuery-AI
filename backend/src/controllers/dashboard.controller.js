import Query from "../models/query.model.js";
import WatchedRegion from "../models/watchedRegion.model.js";
import { asyncHandler } from "../utils/error.handler.js";

/**
 * @description Computes the stat-card and activity-feed data for the
 * Overview page, scoped to the authenticated user. All numbers here come
 * from real database aggregation — nothing is hardcoded.
 * @route GET /api/dashboard/overview
 * @access Private
 */
export const getOverview = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    queriesThisWeek,
    activeAlertsCount,
    criticalAlertsCount,
    regionsMonitoredCount,
    avgConfidenceResult,
    recentQueries,
    activeAlerts,
  ] = await Promise.all([
    Query.countDocuments({ userId, createdAt: { $gte: sevenDaysAgo } }),
    WatchedRegion.countDocuments({ userId, riskLevel: { $in: ["watch", "critical"] } }),
    WatchedRegion.countDocuments({ userId, riskLevel: "critical" }),
    WatchedRegion.countDocuments({ userId }),
    Query.aggregate([
      { $match: { userId, "satelliteResult.confidence": { $ne: null } } },
      { $group: { _id: null, avg: { $avg: "$satelliteResult.confidence" } } },
    ]),
    Query.find({ userId }).sort({ createdAt: -1 }).limit(5),
    WatchedRegion.find({ userId, riskLevel: { $in: ["watch", "critical"] } })
      .sort({ updatedAt: -1 })
      .limit(5),
  ]);

  const avgConfidence = avgConfidenceResult[0]?.avg
    ? Math.round(avgConfidenceResult[0].avg)
    : 0;

  res.status(200).json({
    success: true,
    data: {
      stats: {
        queriesThisWeek,
        activeAlertsCount,
        criticalAlertsCount,
        regionsMonitoredCount,
        avgConfidence,
      },
      recentQueries,
      activeAlerts,
    },
  });
});
