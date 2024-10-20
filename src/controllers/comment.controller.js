import mongoose, { isValidObjectId, Schema } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video not found");
  }

  // let getAllComments;
  // try {
  //     getAllComments = Comment.aggregate([
  //         {
  //             $match: {
  //                 video: new mongoose.Types.ObjectId(videoId)
  //             }
  //         },
  //         {
  //             $lookup: {
  //                 from: "users",
  //                 localField: "owner",
  //                 foreignField: "_id",
  //                 as: "details",
  //                 pipeline: [
  //                     {
  //                         $project: {
  //                             fullname: 1,
  //                             avatar: 1,
  //                             username: 1
  //                         }
  //                     }
  //                 ]
  //             }
  //         },
  //         {
  //             $lookup: {
  //                 from: "likes",
  //                 localField: "owner",
  //                 foreignField: "likedBy",
  //                 as: "likes",
  //                 pipeline: [
  //                     {
  //                         $match: {
  //                             comment: {$exists: true}
  //                         }
  //                     }
  //                 ]
  //             }
  //         },
  //         {
  //             $addFields: {
  //                 details: {
  //                     $first: "$details"
  //                 }
  //             }
  //         },
  //         {
  //             $addFields: {
  //                 likes: {$size: "$likes"}
  //             }
  //         },
  //         {
  //             $skip: (page - 1) * limit,
  //         },
  //         {
  //             $limit: parseInt(limit),
  //         },
  //     ]);
  // } catch (error) {
  //     throw new ApiError(
  //         500,
  //         "Something went wrong while fetching Comments !!"
  //     );
  // }

  // 2. create a pipeline to match the videoId
  let pipeline = [{ $match: { video: new mongoose.Types.ObjectId(videoId) } }];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    customLabels: {
      totalDocs: "total_comments",
      docs: "Comments",
    },
  };

//   const result = await Comment.aggregatePaginate(pipeline, options);

  // 3. use aggregatePaginate to get all comments
  const allComments = await Comment.aggregatePaginate(pipeline, options);

  if (allComments?.total_comments === 0) {
    throw new ApiError(400, "Comments not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { "Comments": allComments, "size": allComments.length })
    );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video not found");
  }
  if (!content) {
    throw new ApiError(400, "Create a valid comment");
  }

  const response = await Comment.create({
    content: content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!response) {
    throw new ApiError(400, "Something went wrong while adding comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const content = req.body;

  if (content?.trim() === "") {
    throw new ApiError(400, "Empty comment not allowed");
  }
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Comment not found");
  }

  const response = await Comment.findByIdAndUpdate(
    commentId,
    {
      content,
    },
    { new: true }
  );

  if (!response) {
    throw new ApiError(400, "Something went wrong in updating comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Comment not found");
  }

  const response = await Comment.findByIdAndDelete(commentId);

  if (!response) {
    throw new ApiError(400, "Something went wrong while deleting the comment");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
