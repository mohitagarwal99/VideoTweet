import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloud from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

export { registerUser };