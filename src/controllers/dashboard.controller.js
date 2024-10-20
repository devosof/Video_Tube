import mongoose, { isValidObjectId, mongo } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  // 1. get channel name from the body or params
  // 2. find the channel using the username and get channel id
  // 3. aggregate the total views and total videos
  // 4. aggregate the total subscribers
  // 5. aggregate the total tweets
  // 6. aggregate the total comments
  // 7. aggregate the total video likes
  // 8. aggregate the total comment likes

  let { channel } = req.body;

  channel = await User.findOne({ username: channel });

  if (!channel) {
    throw new ApiError(400, "Channel not found");
  }

  const channelId = new mongoose.Types.ObjectId(channel?._id);

  const totalViewsAndVideos = await Video.aggregate(
    {
      $match: {
        $and: [
          { owner: new mongoose.Types.ObjectId(channelId) },
          { isPublished: true },
        ],
      },
    },
    {
      $group: {
        _id: $owner,
        totalViews: { $sum: $views },
        totalVideos: { $sum: 1 },
      },
    }
  );

  // 4. aggregate the total subscribers
  const totalSubs = await Subscription.aggregate([
    { $match: { channel: new mongoose.Types.ObjectId(channelID) } },
    { $count: "totalSubcribers" }, // Count the total subscribers
  ]);

  // 5. aggregate the total tweets
  const totalTweets = await Tweet.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(channelID) } },
    { $count: "totalTweets" },
  ]);

  // 6. aggregate the total comments
  const totalComments = await Comment.aggregate([
    { $match: { owner: new mongoose.Types.ObjectId(channelID) } },
    { $count: "totalComments" },
  ]);

  // 7. aggregate the total video likes
  const totalVideoLikes = await Like.aggregate([
    {
      $match: {
        $and: [
          { likedBy: new mongoose.Types.ObjectId(channelID) },
          { video: { $exists: true } }, // Find the likes on videos
        ],
      },
    },
    { $count: "totalVideoLikes" },
  ]);

  // 8. aggregate the total comment likes
  const totalCommentLikes = await Like.aggregate([
    {
      $match: {
        $and: [
          { likedBy: new mongoose.Types.ObjectId(channelID) },
          { Comment: { $exists: true } },
        ],
      },
    },
    { $count: "totalCommentLikes" },
  ]);

  // 9. aggregate the total tweet likes
  const totalTweetLikes = await Like.aggregate([
    {
      $match: {
        $and: [
          { likedBy: new mongoose.Types.ObjectId(channelID) },
          { tweet: { $exists: true } },
        ],
      },
    },
    { $count: "totalTweetLikes" },
  ]);

  // it will return the list so extract the first element and get particular field
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalViews: totalViewsAndVideos[0]?.totalViews,
        totalVideos: totalViewsAndVideos[0]?.totalVideos,
        totalSubs: totalSubs[0]?.totalSubcribers,
        totalTweets: totalTweets[0]?.totalTweets,
        totalComments: totalComments[0]?.totalComments,
        totalVideoLikes: totalVideoLikes[0]?.totalVideoLikes,
        totalCommentLikes: totalCommentLikes[0]?.totalCommentLikes,
        totalTweetLikes: totalTweetLikes[0]?.totalTweetLikes,
      },
      "Stats of the chanel"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel  // this is my approach(to be tested)
  // const channelVideos = await Video.find({
  //     owner: req.user?._id
  // })

  // if(!channelVideos){
  //     throw new ApiError(400, "No videos found for the channel")
  // }

  // return res
  // .status(200)
  // .json(
  //     new ApiResponse(200, {Total_Videos: channelVideos.length, Videos: channelVideos}, "Channel videos fetched successfully")
  // )

  const { channelId } = req.body; // get channel id , page, limit from body and query of req.
  const { page, limit } = req.query;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Channel not found");
  }

  let pipeline = [
    {
      $match: {
        $and: [
          { owner: new mongoose.Types.ObjectId(channelId) },
          { isPublished: true },
        ],
      },
    },
    {
      // lookup for the owner details
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: $ownerDetails, // unwind the ownerDetails to get a single document for each video
    },
    {
      //  add fields like username, fullName, avatar
      $addFields: {
        username: "$ownerDetails.username", // Add the username field from the user document
        fullName: "$ownerDetails.fullName",
        avatar: "$ownerDetails.avatar",
      },
    },
    {
      $project: {
        // project the ownerDetails (ownerDetails wont be shown in the final output)
        ownerDetails: 0, // Optionally remove the ownerDetails field from the final output
      },
    },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    customLabels: {
      totalDocs: "total_videos",
      docs: "Videos",
    },
  };

  const videos = await Video.aggregatePaginate(pipeline, options);

  if (videos?.total_videos === 0) {
    throw new Apierror(400, "Videos Not Found");
  }

  return res.status(200).json(new ApiResponse(200, { videos }, "Videos Found"));
});

export { getChannelStats, getChannelVideos };
