import { Router } from "express";
import {
    getUserTweets,
    getAllTweets,
    createTweet,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js"

import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT)

router.route("/:userId").post(createTweet);
router.route("/all").get(getAllTweets);
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router