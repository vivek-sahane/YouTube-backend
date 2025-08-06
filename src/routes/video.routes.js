import { Router } from "express";
import {
    getAllVideos,
    publishAVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .get(getAllVideos)
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
