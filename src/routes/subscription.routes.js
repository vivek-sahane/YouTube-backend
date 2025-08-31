import { Router } from "express";
import {
    getMySubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT);

// Subscribe / unsubscribe to a channel
router.route("/c/:channelId").post(toggleSubscription);
    
// Get subscribers of a channel
router.route("/s/:channelId").get(getUserChannelSubscribers);

// getchannels subscribed by logged-in user
router.route("/me").get(getMySubscribedChannels);

export default router