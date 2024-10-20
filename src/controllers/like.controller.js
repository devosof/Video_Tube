import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video not found")
    }

    // check if the user has already liked
    const videoLike = await Like.findOne({
        $and: [
            {likedBy: req.user?._id},
            {video: videoId}
        ]
    })

    if(!videoLike){
        const liked = await Like.create({
            likedBy: req.user?._id,
            video: videoId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, liked, "Video liked successfully")
        )
    }

    const unLike = await Like.findByIdAndDelete(videoLike._id)
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, unLike, "Video unliked successfully")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Comment not found")
    }

    // check if the user has already liked
    const commentLike = await Like.findOne({
        $and: [
            {likedBy: req.user?._id},
            {comment: commentId}
        ]
    })

    if(!commentLike){
        const liked = await Like.create({
            likedBy: req.user?._id,
            comment: commentId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, liked, "Comment liked successfully")
        )
    }

    const unLike = await Like.findByIdAndDelete(commentLike._id)
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, unLike, "Comment unliked successfully")
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Tweet not found")
    }

    // check if the user has already liked
    const tweetLike = await Like.findOne({
        $and: [
            {likedBy: req.user?._id},
            {tweet: tweetId}
        ]
    })

    if(!tweetLike){
        const liked = await Like.create({
            likedBy: req.user?._id,
            tweet: tweetId
        })

        return res
        .status(200)
        .json(
            new ApiResponse(200, liked, "Tweet liked successfully")
        )
    }

    const unLike = await Like.findByIdAndDelete(tweetLike._id)
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, unLike, "Tweet unliked successfully")
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    // find all the liked videos of the logged in user

    const likedVideos = await Like.find({
        $and: [
            {likedBy: req.user?._id},
            {video: {$exists: true}}
        ]
    })

    if(!likedVideos){
        throw new ApiError(400, "Liked videos not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {
                "Total_Videos": likedVideos.length,
                "Videos": likedVideos
            },
            "Liked videos found!"
        )
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}