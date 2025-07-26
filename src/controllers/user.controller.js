import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
    console.log("email :",  email);

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

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path
    
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

export {registerUser, }