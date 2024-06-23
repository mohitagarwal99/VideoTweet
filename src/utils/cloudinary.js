import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

//Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SCRET, // Click 'View Credentials' below to copy your API secret
});

const uploadOnCloud = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }

    //Upload the file path
    const uploadResult = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // console.log("File uploaded successfully ", uploadResult);
    console.log("File uploaded successfully, url: ", uploadResult.url);
    fs.unlinkSync(localFilePath);
    return uploadResult;
  } catch (error) {
    fs.unlinkSync(localFilePath); //remove temporarirly save locally file synchronously
    return null;
  }
};

const findPublicId = (url) => {
  const parsedPath = path.parse(url);
  return parsedPath.name;
};

const deleteFromCloud = async (url) => {
  try {
    if (!url) {
      return null;
    }
    //Delete the file from cloud
    const id = findPublicId(url);
    const deleteResult = await cloudinary.uploader.destroy(id, {
      resource_type: "image",
    });

    if (deleteResult.result === "ok") {
      console.log("File deleted successfully ", deleteResult);
      return true;
    }
    return false;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export { uploadOnCloud, deleteFromCloud };
