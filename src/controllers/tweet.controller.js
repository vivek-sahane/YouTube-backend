import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all tweets of a specific user
const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const tweets = await Tweet.find({ owner: userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .populate("owner", "username email avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});

// ✅ Get all tweets (Global feed / Top tweets)
const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const tweets = await Tweet.find()
        .sort({ createdAt: -1 }) // newest first (or use likes count later)
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10))
        .populate("owner", "username email avatar");

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "All tweets fetched successfully"));
});

// Create new tweet
const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { userId } = req.params;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content cannot be empty");
    }

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid userId");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const tweet = await Tweet.create({
        content,
        owner: userId,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

// Update tweet
const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to update this tweet");
    }

    tweet.content = content;
    await tweet.save();

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

// Delete tweet
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Not authorized to delete this tweet");
    }

    await tweet.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export {
    getUserTweets,
    getAllTweets,   // ✅ added global feed
    createTweet,
    updateTweet,
    deleteTweet,
};
