import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloud from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Error while generating tokens");
    }
}

const registerUser = asyncHandler( async (req, res) =>{
    // get user details from frontend
    // validation - not empty
    // Check if user already exists using email, usermame
    // check if image is there or avatar is there or not
    // upload images/avatar to cloud
    // save user to database - in mongo db
    // remove password and refresh token field from response - response to user
    // check for user creation
    // return response to user


    const {userName, email, fullName, password} = req.body

    if (
        [fullName, email, password, userName].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are compulsory");
    }

    const existedUser = await User.findOne({$or: [{userName}, {email}]});

    if (existedUser){
        throw new ApiError(408, "User already exists");
    }

    // console.log(req.body)
    // console.log(userName, email, fullName, password)

    // if (fullName === ""){
    //     throw new ApiError(400, "Full Name is required");
    // }


    const avatarPath = req.files?.avatar[0]?.path;
    let coverImagePath;

    if(!avatarPath){
        throw new ApiError(400, "Avatar is required");
    }

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImagePath = req.files.coverImage[0].path;
    }

    const avatar = await uploadOnCloud(avatarPath);
    const coverImage = await uploadOnCloud(coverImagePath);

    

    if (!avatar){
        throw new ApiError(500, "Error in uploading avatar");
    }

    const user = await User.create({
        fullname: fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: userName.toLowerCase(),
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser){
        throw new ApiError(500, "Error while creating user");
    }
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    );
})

const loginUser = asyncHandler(async (req, res) => {
    // get email/username and password from req
    // check if user exists
    // find user by email or username
    // check is password is correct
    // generate access token and refresh token
    // send cookie

    const {email, userName, password} = req.body;

    if (!email && !userName){
        throw new ApiError(400, "Email or username is required")
    }

    const user = await User.findOne({$or: [{email}, {userName}]});

    if (!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordMatch(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials");
    }

    const {accessToken, refreshToken} = await generateTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true,
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(
        200,
        {
            user: loggedInUser,
            accessToken,
            refreshToken,

        },
        "User logged in successfully"
    ))
})

const logoutUser = asyncHandler(async (req, res) => {
    //clear cookies
    // reset refresh token in db
    // send response
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            },
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
    .json(
        new ApiResponse(
            200,
            {},
            "User logged out successfully !"
        )
    )

})

const refreshAccessToken = asyncHandler(async (req, res) => {
    // get refresh token from cookie
    // check if refresh token is valid
    // generate new access token
    // send response

    const inputRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!inputRefreshToken){
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(inputRefreshToken, REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id);
    
        if( !user ){
            throw new ApiError(401, "Unauthorized request");
        }
    
        if ( inputRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is either expired or used");
        }
    
        const options = {
            httpOnly: true,
            secure: true,
    
        }
    
        const {accessToken, refreshToken} = await generateTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("RefreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken
                },
                "Acess token refreshed successfully"
            )
        )
    } catch (error) {
        new ApiError(401, error?.message || "Invalid refresh token");
    }
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
 };