import { request, response } from 'express'
import Image from '../../../DB/model/image.model.js'
import { cloudinaryRemoveImage, cloudinaryUploadImage } from '../../utils/cloudinary.js'
import { asyncHandler } from '../../utils/error.js'

/** ----------------------------------------------------------------
 * @desc add new image
 * @route /images
 * @method POST
 * @access admin
 * -----------------------------------------------------------------
 */
export const createImage = asyncHandler(async (req = request, res = response, next) => {
    const { imageType, link } = req.body

    const { secure_url, public_id } = await cloudinaryUploadImage(
        req.file.path,
        `${process.env.APP_NAME}/constant_images/${imageType}`
    )
    const imageInfo = {
        secure_url,
        public_id,
        imageType,
        ...(link && { link }),
    }

    const imageCreated = await Image.create(imageInfo)
    return res.status(201).json({ message: 'success', image: imageCreated })
})
/** ----------------------------------------------------------------
 * @desc update image
 * @route /images/:id
 * @method PUT
 * @access admin
 * -----------------------------------------------------------------
 */
export const updateImage = asyncHandler(async (req = request, res = response, next) => {
    const { imageType, link } = req.body
    const { id } = req.params
    const image = await Image.findById(id)
    if (!image) return next(new Error(`Image not found.`, { cause: 404 }))
    if (imageType) image.imageType = imageType
    if (link || link == '') image.link = link
    if (req.file) {
        const { secure_url, public_id } = await cloudinaryUploadImage(
            req.file.path,
            `${process.env.APP_NAME}/constant_images/${imageType || image.imageType}`
        )
        await cloudinaryRemoveImage(image.public_id)
        image.public_id = public_id
        image.secure_url = secure_url
    }
    image.updatedBy = req.user._id
    await image.save()
    return res.status(200).json({ message: 'success', image })
})
/** ----------------------------------------------------------------
 * @desc delete image
 * @route /images/:id
 * @method DELETE
 * @access admin
 * -----------------------------------------------------------------
 */
export const deleteImage = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const image = await Image.findByIdAndDelete(id)
    if (!image) return next(new Error(`Image not found.`, { cause: 404 }))
    await cloudinaryRemoveImage(image.public_id)
    return res.status(200).json({ message: 'success', imageId: image._id })
})
/** ----------------------------------------------------------------
 * @desc get all images
 * @route /images
 * @method GET
 * @access all
 * -----------------------------------------------------------------
 */
export const getAll = asyncHandler(async (req = request, res = response, next) => {
    const { imageType } = req.query

    const images = await Image.find({
        ...(imageType && { imageType }),
    })

    return res.status(200).json({ message: 'success', images })
})

/** ----------------------------------------------------------------
 * @desc get single
 * @route /images/:id
 * @method GET
 * @access admin
 * -----------------------------------------------------------------
 */
export const getSingle = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const image = await Image.findById(id)
    if (!image) return next(new Error(`Image not found.`, { cause: 404 }))
    return res.status(200).json({ message: 'success', image })
})
