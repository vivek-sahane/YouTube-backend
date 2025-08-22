import mongoose from "mongoose";
import {Comment} from "../models/comment.model.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const getVideoComments = asyncHandler( async(req, res)=> {
    const {videoId} = req.params
    const {page=1, limit=10} = req.query

    if(!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Build aggregation pipeline
    const commentsAggregate = Comment.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) }
        },
        {
            $sort: { createdAt: -1}     // latest comments first
        }
    ]);

    const comments = await Comment.aggregatePaginate(commentsAggregate, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        populate: {path: "owner", select: "username email"},       // populate user info
    });

    //const comments = await Comment.aggregatePaginate({video: videoId}, options);

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler( async(req, res)=> {
    const { videoId } = req.params
    const { content } = req.body

    if(!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if(!content || content.trim() === "") {
        throw new ApiError(400, "Comment contest is required");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id,       // from verifyJWT middleware
    })


    return res.status(201).json(
        new ApiResponse(201, comment, "Comment added successfully")
    )

});

const updateComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    const {content} = req.body;

    if(!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    if(!content || content.trim() === "") {
        throw new ApiError(400, "Updated comment content is required");
    }

    const comment = await Comment.findById(commentId);

    if(!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // check ownership
    if(comment.owner.toString() != req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this comment");
    }

    comment.content = content;
    await comment.save();

    return res
        .status(200)
        .json(new ApiResponse(200, comment, "Comment updated successgully"));
})

const deleteComment = asyncHandler( async(req, res) => {
    const { commentId } = req.params;

    if(!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const comment = await Comment.findById(commentId);

    if(!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // check ownership
    if(comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this comment");
    }

    await comment.deleteOne()

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment deleted successfully"));

})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
}