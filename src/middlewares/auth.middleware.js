import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

// checking user is present or not
export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // 1. Get token from cookie or Authorization header (case-insensitive, trims)
    let token =
      req.cookies?.accessToken ||
      (() => {
        const authHeader = req.header("Authorization") || req.header("authorization");
        if (!authHeader) return null;
        const parts = authHeader.split(" ");
        if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
          return parts[1].trim();
        }
        return null;
      })();

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // 2. Verify token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // 3. Fetch user (exclude sensitive fields)
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    // Distinguish expiration vs other errors if you want (optional)
    throw new ApiError(401, error?.message || "Invalid Access Token");
  }
});
