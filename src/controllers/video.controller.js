import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    
    // 1. Get the page, limit, query, sortBy, sortType, userId from the request query(frontend) [http://localhost:8000/api/v1/video/all-video?page=1&limit=10&query=hello&sortBy=createdAt&sortType=1&userId=123]
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = 1, userId = "" } = req.query

    // 2. Get all videos based on query, sort, pagination)
    let pipeline = [
        {
            $match: {
                $and: [
                    {
                        // 2.1 match the videos based on title and description
                        $or: [
                            { title: { $regex: query, $options: "i" } },   // $regex: is used to search the string in the title "this is first video" => "first"  // i is for case-insensitive
                            { description: { $regex: query, $options: "i" } }
                        ]
                    },
                    // 2.2 match the videos based on userId=Owner
                    ( userId ? [ { owner: new mongoose.Types.ObjectId( userId ) } ] : "" )  // if userId is present then match the Owner field of video 
                    // new mongoose.Types.ObjectId( userId ) => convert userId to ObjectId
                ]
            }
        },
        // 3. lookup the Owner field of video and get the user details
        {   // from user it match the _id of user with Owner field of video and saved as Owner
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "details",
                pipeline: [  // project the fields of user in Owner 
                    {
                        $project: {
                            _id: 1,
                            fullName: 1,
                            avatar: "$avatar.url",
                            username: 1,
                        }
                    }
                ]
            }
        },
        {
            // 4. addFields just add the details field to the video document 
            $addFields: {
                details: {
                    $first: "$details",  // $first: is used to get the first element of details array
                },
            },
        },
        {
            $sort: { [ sortBy ]: sortType }  // sort the videos based on sortBy and sortType
        }
    ];

    try
    {
        // 5. set options for pagination
        const options = {  // options for pagination
            page: parseInt( page ),
            limit: parseInt( limit ),
            customLabels: {   // custom labels for pagination
                totalDocs: "totalVideos",
                docs: "videos",
            },
        };

        // 6. get the videos based on pipeline and options
        const result = await Video.aggregatePaginate( Video.aggregate( pipeline ), options );  // Video.aggregate( pipeline ) find the videos based on pipeline(query, sortBy, sortType, userId). // aggregatePaginate is used for pagination (page, limit)

        if ( result?.videos?.length === 0 ) { return res.status( 404 ).json( new ApiResponse( 404, {}, "No Videos Found" ) ); }

        // result contain all pipeline videos and pagination details
        return res.status( 200 ).json( new ApiResponse( 200, result, "Videos fetched successfully" ) );

    } catch ( error )
    {
        console.error( error.message );
        return res.status( 500 ).json( new ApiError( 500, {}, "Internal server error in video aggregation" ) );
    }
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video



    // if(title?.trim() === "" && description?.trim() === ""){
    //     throw new ApiError(400, "Title and description is required")
    // }
    if([title, description].some((field) => {field.trim() === ""})) {
        throw new ApiError(400, "Please provide all details")
    }

    const videoLocalPath = req.files?.videoFile[0].path

    if(!videoLocalPath){
        throw new ApiError(400, "Please Upload Video")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0].path
    if(!thumbnailLocalPath){
        throw new ApiError(400, "Please upload Thumbnail")
    }

    const video = await uploadOnCloudinary(videoLocalPath)
    if(!video){
        throw new ApiError(400, "Something went wrong in uploading the video")
    }
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail){
        throw new ApiError(400, "Something went wrong in uploading thumbnail")
    }

    const response = await Video.create(
        {
            videoFile: video.url,
            thumbnail: thumbnail.url,
            title: title,
            description: description,
            duration: video.duration,
            isPublished: true,
            owner: req.user?._id
        }
    )

    if(!response){
        throw new ApiError(400, "Something went wrong while uploading the video")
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, response, "Video uploaded successfully")
    )




})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video not found")
    }

    const response = await Video.findById(videoId)

    if(!response){
        throw new ApiError(400, "Failed to get video")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, response, "Video fetched successfully")
    )
    
})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid VideoID.");
    }
    const thumbnailLocalPath = req.file?.path;

    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "At lease one field is required.");
    }

    let thumbnail;
    if (thumbnailLocalPath) {
        thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

        if (!thumbnail.url) {
            throw new ApiError(
                400,
                "Error while updating thumbnail in cloudinary."
            );
        }
    }

    const video = await Video.findById(videoId)
    if(!(video.owner.equals(req.user?._id))){
        throw new ApiError(400, "You can't update this video")
    }

    const response = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail,
            },
        },
        { new: true }
    );

    if (!response) {
        throw new ApiError(401, "Video details not found.");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, response, "Video details updated succesfully.")
        );




    

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video not found")
    }



    const video = await Video.findById(videoId)
    // 2.2. Check if the video is owned by the user [video.Owner.equals(req.user._id)] only owner can delete the video
    if ( !video.owner.equals( req.user?._id ) ) { 
        throw new ApiError( 403, "You are not authorized to delete this video" ); }

    // delete the video file
    // 3. delete the videoFile and thumbnail from cloudinary
    const videoFile = await deleteFromCloudinary( video.videoFile)
    const thumbnail = await deleteFromCloudinary( video.thumbnail)

    if ( !videoFile && !thumbnail ) { 
        throw new ApiError( 400, "thumbnail or videoFile is not deleted from cloudinary" ) }

    
    await video.remove()

    return res
    .status(200)
    .json(200, {}, "Video deleted successfully")
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Video not found")
    }

    // get the publish status from the front-end:
    const publishStatus = req.body

    // find the video by the id
    const video = await findOne({
        $and: [
            {_id: videoId},
            {owner: req.user?._id}
        ]
    })

    if(!video){
        throw new ApiError(400, "Invalid video id or owner")
    }

    video.isPublished = !video.isPublished

    await video.save()

   return res
   .status(200)
   .json(
    new ApiResponse(200, video.isPublished, "isPublished toggled successfully")
   )
    


})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}