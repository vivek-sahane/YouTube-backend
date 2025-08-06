import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js"
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { json } from "express";

const getAllVideos = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, query, sortBy, sortType = "desc", userId } = req.query;

  page = Number(page);
  limit = Number(limit);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const filter = {};
  if (userId) {
    if (!isValidObjectId(userId)) throw new ApiError(400, "Invalid userId");
    filter.owner = userId;
  }

  let mongoQuery = { ...filter };
  const projection = {};
  const sortOptions = {};

  if (query) {
    // use full-text search (requires text index on title/description)
    mongoQuery.$text = { $search: query };
    projection.score = { $meta: "textScore" };
    if (!sortBy) {
      sortOptions.score = { $meta: "textScore" };
    }
  }

  if (sortBy) {
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;
  }

  if (Object.keys(sortOptions).length === 0) {
    sortOptions.createdAt = -1;
  }

  const [videos, total] = await Promise.all([
    Video.find(mongoQuery, projection)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(limit),
    Video.countDocuments(mongoQuery),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      "Videos fetched successfully"
    )
  );
});


const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  // 1. validate title/description
  if ([title, description].some((field) => !field || field.trim() === "")) {
    throw new ApiError(400, "title & description both required for video");
  }

  // 2. video file
  const videoFileObj = req.files?.videoFile?.[0];
  if (!videoFileObj || !videoFileObj.path) {
    throw new ApiError(400, "Video file is required");
  }
  const videoLocalPath = videoFileObj.path;

  const videoo = await uploadOnCloudinary(videoLocalPath);
  if (!videoo || !videoo.url) {
    throw new ApiError(400, "Video file not uploaded on Cloudinary");
  }

  // 3. thumbnail
  const thumbnailObj = req.files?.thumbnail?.[0];
  if (!thumbnailObj || !thumbnailObj.path) {
    throw new ApiError(400, "Thumbnail file is required");
  }
  const thumbnailLocalPath = thumbnailObj.path;

  const thumbnaill = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnaill || !thumbnaill.url) {
    throw new ApiError(400, "Thumbnail file not uploaded on Cloudinary");
  }

  const duration = videoo.duration || 0;

  // 4. create video document
  const video = await Video.create({
    title: title.trim(),
    description: description.trim(),
    videoFile: videoo.url,
    thumbnail: thumbnaill.url,
    duration,
    owner: req.user._id,
  });

  const uploadVideo = await Video.findById(video._id);
  if (!uploadVideo) {
    throw new ApiError(
      500,
      "Something went wrong while uploading video & its content in MongoDB"
    );
  }

  return res.status(201).json(
    new ApiResponse(201, uploadVideo, "Video uploaded Successfully")
  );
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    togglePublishStatus
}