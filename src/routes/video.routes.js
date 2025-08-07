import { Router } from "express";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";       // this upload is imported from multer it is used in router for uploding files

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

router.route("/:videoId")
    .get(getVideoById)
    .put(
        upload.single("thumbnail"),
        updateVideo
    )
    .delete(deleteVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);


export default router;
