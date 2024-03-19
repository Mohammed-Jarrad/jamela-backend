import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

const cloudinaryUploadImage = async (imagePath, folder) => {
    const { secure_url, public_id } = await cloudinary.uploader.upload(imagePath, {
        folder,
        resource_type: 'image',
    })
    return { secure_url, public_id }
}

const cloudinaryRemoveImage = async (publicId) => {
    await cloudinary.uploader.destroy(publicId)
}

export { cloudinaryRemoveImage, cloudinaryUploadImage }

export default cloudinary
