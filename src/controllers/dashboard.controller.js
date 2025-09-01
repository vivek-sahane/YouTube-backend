import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ✅ Get channel stats
const getChannelStats = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    // 1. Total videos & total views
    const videoStats = await Video.aggregate([
        { $match: { owner: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalVideos: { $sum: 1 },
                totalViews: { $sum: "$views" }
            }
        }
    ]);

    const totalVideos = videoStats[0]?.totalVideos || 0;
    const totalViews = videoStats[0]?.totalViews || 0;

    // 2. Total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: userId });

    // 3. Total likes across all videos
    const videoIds = await Video.find({ owner: userId }).distinct("_id");
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

    return res.status(200).json(
        new ApiResponse(200, {
            totalVideos,
            totalViews,
            totalSubscribers,
            totalLikes
        }, "Channel stats fetched successfully")
    );
});


// ✅ Get all channel videos
const getChannelVideos = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId || !mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const videos = await Video.find({ owner: userId })
        .sort({ createdAt: -1 })
        .select("-__v");

    if (!videos || videos.length === 0) {
        return res
            .status(200)
            .json(new ApiResponse(200, [], "No videos found for this channel"));
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});


export {
    getChannelStats,
    getChannelVideos
};
