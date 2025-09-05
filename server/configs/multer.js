import multer from "multer";

//will use the following upload method to upload any image on the cloudinary.
export const upload = multer({storage: multer.diskStorage({})})
