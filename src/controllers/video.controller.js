import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js"
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// const getAllVideos = asyncHandler( async(resizeBy, res)=> {
//     const { page =1, limit = 10, query, sortBy, sortType, userId} = req.query
//     // 
// })

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // get video , upload to cloudinary, create video

    //1. check for title and description

    if([title, description].some((field) => field?.trim() === "")){
        throw new ApiError(400, "title & description both required for video")
    }

    // 2. for videofile uploading on cloudinary

    const videoLocalPath = req.files?.videoFile[0]?.path;

    if(!videoLocalPath) {
        throw new ApiError(400, "Video File is required")
    }

    const videoo = await uploadOnCloudinary(videoLocalPath)

    if(!videoo) {
        throw new ApiError(400, "VideoFile not uploaded on cloudinary")
    }

    // 3. thumbnail

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!thumbnailLocalPath) {
        throw new ApiError(400, "Thubmnail localfile path not found")
    }

    const thumbnaill = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnaill) {
        throw new ApiError(400, "Thumbnail file not uploaded on cloudnary")
    }

    const duration = videoo.duration

    const video = await Video.create({
        title,
        description,
        videoFile: videoo.url,
        thumbnail: thumbnaill.url,
        duration,
        owner: req.user._id
    })

    const uploadVideo = await Video.findById(video._id);

    if(!uploadVideo) {
        throw new ApiError(500, "Something went wrong while uploading video & its content in mongodb")
    }

    return res.status(201).json(
        new ApiResponse(201, uploadVideo, "Video uploaded Successfully")
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    publishAVideo,
    togglePublishStatus
}