import WatchedRegion from "../models/watchedRegion.model.js";
import { asyncHandler } from "../utils/error.handler.js";

/**
 * @description Adds a new region to the current user's watch list.
 * @route POST /api/alerts
 * @access Private
 */
export const createWatchedRegion = asyncHandler(async (req, res) => {
  const region = await WatchedRegion.create({ ...req.body, userId: req.user._id });
  res.status(201).json({ success: true, data: { region } });
});

/**
 * @description Lists all regions the current user is watching.
 * @route GET /api/alerts
 * @access Private
 */
export const listWatchedRegions = asyncHandler(async (req, res) => {
  const regions = await WatchedRegion.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { regions } });
});

/**
 * @description Updates a watched region's threshold and/or notification
 * preference. Scoped to the owning user.
 * @route PATCH /api/alerts/:id
 * @access Private
 */
export const updateWatchedRegion = asyncHandler(async (req, res) => {
  const region = await WatchedRegion.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!region) {
    return res.status(404).json({ success: false, message: "Watched region not found" });
  }

  res.status(200).json({ success: true, data: { region } });
});

/**
 * @description Removes a region from the current user's watch list.
 * @route DELETE /api/alerts/:id
 * @access Private
 */
export const deleteWatchedRegion = asyncHandler(async (req, res) => {
  const region = await WatchedRegion.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!region) {
    return res.status(404).json({ success: false, message: "Watched region not found" });
  }

  res.status(200).json({ success: true, message: "Watched region removed" });
});
