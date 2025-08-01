import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Somethng went wrong while generating refresh & Access Token")
    }
}

const registerUser = asyncHandler( async(req, res) => {
    // get user details from frontend
    // Validation - not empty
    // check if user lready exists - username, email
    // check for images , check for avtar
    // upload them to cloudinary ,avatar
    // create user object - create entry in db
    // remove password and refreshtoken filed from response
    // check fro user creation 
    // return res

    // 1. get user details from frontend we hve take frompostman
    const {fullName, email, username, password} = req.body
    //console.log("email :",  email);

    // 2.// Validation - not empty using ApiError.js from utils
    if(
        [fullName, email, username, password].some((field)=>
        field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // User.model.js have all access to database which check if record present earlier or not in db
    const existedUser = await User.findOne({
        $or: [{username},  {email}]
    })

    if(existedUser) {
        throw new ApiError(409, "User with email or usernamealready exists")
    }

    //console.log(req.files);
    

    const avatarLocalPath = req.files?.avatar[0]?.path
    //const coverImageLocalPath = req.files?.coverImage[0]?.path
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    // for uploading images we already setup our cloudinary.js functions
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if( !avatar) {
        throw new ApiError(400, "Avatar file is required")
    }

    // create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    // remove password and refreshtoken filed from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser) {
        throw new ApiError(500, "something went wrong while registering a user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

})

const loginUser = asyncHandler( async(req, res) => {
    // req body -> data
    // username or email
    // find the user
    // check password
    // access and refresh token
    // send cookie

    const {email, username, password} = req.body

    if(!username && !email) {
        throw new ApiError(400, "username or password is required")
    }

    const user = await User.findOne({
        $or : [{email},{username}]
    })

    if(!user) {
        throw new ApiError(404,"User does not exist")
    }

    const isPasswordValid =  await user.isPasswordCorrect(password)

    if(!isPasswordValid) {
        throw new ApiError(401,"Invalid User credentials")
    }

    const{accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")    // .select indicates that this object we dont want to retrive

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In successFully"
        )
    )

})


const logoutUser = asyncHandler( async(req, res)=> {

    User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken : undefined
            }
        },
        {
            new: true
        }
    )
    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"))
})

const refreshAccessToken = asyncHandler( async(req, res) => {

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken =  jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)      // verify hone ke baad decoded token milega
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refreshed token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, newRefreshToken},
                "Access token refresh successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler( async(req, res)=> {

    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, "Password chenged successfully"))

})

const getCurrentUser = asyncHandler( async(req, res)=> {
    return res
    .status(200)
    .json(200, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler( async(req, res)=> {

    const {fullName, email} = req.body

    if(!fullName && !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                fullName,
                email:email
            }
        },
        {new: true}
    ).select(-password)

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account detailsupddated successfully"))
})

const updateUserAvatar = asyncHandler( async(req, res)=> {

    const avatarPath = req.file?.path

    if(!avatarPath) {
        throw new ApiError(400, "avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarPath)

    if(!avatar.url) {
        throw new ApiError(400, "while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,

        {
            $set: {
                avatar: avatar.url
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, "avatar Image Updated successfully"))

})

const updateUserCoverImage  = asyncHandler( async(req, res)=> {

    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "coverImagePath file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(400, "while uploading on coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,

        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new : true}
    ).select("-password")

    return res.status(200)
    .json(new ApiResponse(200, "coverImage Updated successfully"))

})

const getUserChannelProfile = asyncHandler( async(req, res)=> {

    const{username} = req.params        // channel ke username se access krenge

    if(!username?.trim()) {
        throw new ApiError(400, "username is missing");
    }

    // aggregate pipeline for getting cout of subscribers and channels we have subscribed efficiently
    // for channel users check for that channel where after subscribe different document is created of channel and subscriber
    const channel = await User.aggregate([
        {
            $match : {                                  // here we reach the channel
                username: username?.toLowerCase()
            }
        },
        {
            $lookup : {                                 // cheaking how many subscribers
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as:"subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size :"$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {                    // check if we subscribed that channel or not use in function for cheking user present in document or not
                    $cond : {
                        if : {$in : [req.user?._id, "$subscribers.subscriber"]},
                        then : true,
                        else : flase
                    }
                }
            }
        },
        {
            $project : {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,

            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404, "Channel does not exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "User channel fetch successfully"))
})

export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar , updateUserCoverImage, getUserChannelProfile}