import mongoose, { isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    // check if subscription exists
    const subscribed = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id
    });

    if (subscribed) {
        await subscribed.deleteOne();
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unsubscribed successfully"));
    }

    await Subscription.create({
        channel: channelId,
        subscriber: req.user._id
    });

    return res
        .status(201)
        .json(new ApiResponse(201, {}, "Subscribed successfully"));
});

const getUserChannelSubscribers = asyncHandler( async(req, res) => {
    const {channelId} = req.params

    if(!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id");
    }

    // find all subscribers where channel = channelId
    const subscribers = await Subscription.find({channel : channelId})
        .populate("subscriber", "username email avatar")    // populate subscriber info
        .sort({createdAt: -1}); // newest first (optional)

    return res.status(200).json(new ApiResponse(200, subscribers, "subscribers fetched successfully"))    
});


const getMySubscribedChannels = asyncHandler(async (req, res) => {
    // logged-in user's id comes from verifyJWT middleware
    const userId = req.user._id;

    const subscribedChannels = await Subscription.find({ subscriber: userId })
        .populate("channel", "username email avatar") // only bring back channel info
        .sort({ createdAt: -1 }); // optional: newest subscriptions first

    return res.status(200).json(
        new ApiResponse(200, subscribedChannels, "Fetched subscribed channels successfully")
    );
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getMySubscribedChannels
};
