import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";

// checking user is present or not
export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authtorization")?.replace("Bearer", "")
    
        if(!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user) {
            // nextVideo : Discuss about frontend
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }

})  