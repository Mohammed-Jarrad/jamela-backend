import { request, response } from "express";
import brandModel from "../../../DB/model/brand.model.js";
import { asyncHandler } from "../../utils/error.js"; 
import slugify from 'slugify';   
import { cloudinaryRemoveImage, cloudinaryUploadImage } from "../../utils/cloudinary.js";

/** ----------------------------------------------------------------
 * @desc create new brand
 * @route /brands
 * @method POST
 * @access only admin
   -----------------------------------------------------------------
 */
export const createBrand = asyncHandler(async (req = request, res = response, next) => {
    const { name } = req.body;
    const image = req.file
    if (await brandModel.findOne({ name })) {
        return next(new Error(`Brand ${name} is already exist.`, { cause: 409 }));
    }
    const { secure_url, public_id } = await cloudinaryUploadImage(image.path, `${process.env.APP_NAME}/brands`)
    const brandInfos = {
        name, 
        slug: slugify(name),
        createdBy: req.user._id,
        updatedBy: req.user._id,
        image: { secure_url, public_id },
    }
    const brand = await brandModel.create(brandInfos);
    return res.status(200).json({ message: "success", brand });
});

/** ----------------------------------------------------------------
 * @desc get all brands
 * @route /brands
 * @method GET
 * @access only admin
   -----------------------------------------------------------------
 */
export const getAllBrands = asyncHandler(async (req = request, res = response, next) => {
    const brands = await brandModel.find();
    return res.status(200).json({ message: "success", brands });
});

/** ----------------------------------------------------------------
 * @desc get active brands
 * @route /brands/active
 * @method GET
 * @access all
   -----------------------------------------------------------------
 */
export const getActiveBrands = asyncHandler(async (req = request, res = response, next) => {
    const brands = await brandModel.find({ status: "Active" });
    return res.status(200).json({ message: "success", brands });
})

/** ----------------------------------------------------------------
 * @desc update brand
 * @route /brands/:id
 * @method PUT
 * @access admin
   -----------------------------------------------------------------
 */
export const updateBrand = asyncHandler(async (req = request, res = response, next) => {
    const { name, status } = req.body
    const image = req.file
    const updateObj = {}
    if (name) {
        if (await brandModel.findOne({ name, _id: { $ne: req.params.id } }).select('name'))
            return next(new Error(`Brand ${name} is already exists.`, { cause: 409 }))
        updateObj.name = name
        updateObj.slug = slugify(name)
    }
    if (status) updateObj.status = status
    if (image) {
        const { secure_url, public_id } = await cloudinaryUploadImage(image.path, `${process.env.APP_NAME}/brands`)
        await cloudinaryRemoveImage(image.public_id)
        updateObj.image = { secure_url, public_id }
    }
    updateObj.updatedBy = req.user._id
    const brand = await brandModel.findByIdAndUpdate(req.params.id, updateObj, { new: true });
    if (!brand) return next(new Error(`Brand not found.`, { cause: 404 }));
    return res.status(200).json({ message: "success", brand });
})

/** ----------------------------------------------------------------
 * @desc  delete
 * @route /brands/:id
 * @method DELETE
 * @access admin
   -----------------------------------------------------------------
 */
export const deleteBrand = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const brand = await brandModel.findById(id)
    if (!brand) return next(new Error(`Brand not found.`, { cause: 404 }));
    await brand.deleteOne()
    return res.status(200).json({ message: 'success', brandId: brand._id })
})
/** ----------------------------------------------------------------
 * @desc  get one
 * @route /brands/:id
 * @method GET
 * @access ALL
   -----------------------------------------------------------------
 */
export const getBrand = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const brand = await brandModel.findById(id)
    if (!brand) return next(new Error(`Brand not found.`, { cause: 404 }));
    return res.status(200).json({ message: 'success', brand })
})
