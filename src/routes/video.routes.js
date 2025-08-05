import { Router } from "express";
import {
    publishAVideo,
    togglePublishStatus // ✅ Add this
} from "../controllers/video.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT); // ✅ Protect all video routes

router
    .route("/")
    .post(
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 },
        ]),
        publishAVideo
    );

// ✅ Uncomment when ready to use
// router.route("/:videoId")
//     .get(getVideoById)
//     .put(updateVideo)
//     .delete(deleteVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router;
