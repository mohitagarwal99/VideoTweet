import {v2 as cloudinary} from 'cloudinary';
import fs from "fs";

//Cloudinary Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SCRET // Click 'View Credentials' below to copy your API secret
});


const uploadOnCloud = async (localFilePath) => {
    try {

        if(!localFilePath){
            return null;
        }

        //Upload the file path
        const uploadResult = await cloudinary.uploader.upload(localFilePath, 
            {
                resource_type: "auto",
            },
        );
        // console.log("File uploaded successfully ", uploadResult);
        console.log("File uploaded successfully, url: ", uploadResult.url);
        fs.unlinkSync(localFilePath);
        return uploadResult;

    } catch (error) {
        fs.unlinkSync(localFilePath); //remove temporarirly save locally file synchronously
        return null;
    }
}


export default uploadOnCloud;