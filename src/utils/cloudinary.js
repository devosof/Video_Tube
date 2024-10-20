import {v2 as cloudinary} from "cloudinary";
import fs from "fs";


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null 
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully
        // console.log("file is uploaded on cloudinary ",
        //     response.url
        // );
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temp file as the upload operation got failed
        return null
    }
}


const deleteFromCloudinary = async (cloudinaryFile) => {
    try {
        if(!cloudinaryFile) return null

        // get the public id of the old cloudinary file:
        const publicId = cloudinaryFile["public_id"]
        const response = cloudinary.v2.uploader
                            .destroy(publicId)
                            // .then(result=>console.log(result));
        return response

    } catch (error) {
        console.log(error)
    }
}



export {uploadOnCloudinary}
 