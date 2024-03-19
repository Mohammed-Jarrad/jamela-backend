import bcrypt from 'bcryptjs'
import { request, response } from 'express'
import productModel from '../../../DB/model/product.model.js'
import userModel from '../../../DB/model/user.model.js'
import { admin } from '../../middlewares/auth.js'
import { getSearchQuery, getSelectQuery, getSortQuery } from '../../utils/apiFilter.js'
import { cloudinaryRemoveImage, cloudinaryUploadImage } from '../../utils/cloudinary.js'
import { asyncHandler } from '../../utils/error.js'
import { pagination } from '../../utils/pagination.js'

/** ----------------------------------------------------------------
 * @desc get user
 * @route /users/profile
 * @method GET
 * @access user himself
 * -----------------------------------------------------------------
 */
export const getProfile = asyncHandler(async (req = request, res = response, next) => {
    const userId = req.user._id
    const user = await userModel
        .findById(userId)
        .select('-password -code -changePasswordTime')
        .populate({
            path: 'wishList',
            // select: 'name slug price mainImage discount finalPrice categoryId',
            populate: { path: 'categoryId', select: 'name' },
        })
        .populate({
            path: 'cart',
            populate: {
                path: 'products.productId',
                select: 'name slug price mainImage discount finalPrice stock sizes colors',
                populate: {
                    path: 'categoryId',
                    select: 'name',
                },
            },
        })
    if (!user) return next(new Error(`User not found.`, { cause: 404 }))
    return res.status(200).json({ message: 'success', user })
})
/** ----------------------------------------------------------------
 * @desc update profile
 * @route /users/profile/update
 * @method PUT
 * @access logged in user
 * -----------------------------------------------------------------
 */
export const updateProfile = asyncHandler(async (req = request, res = response, next) => {
    const userId = req.user._id
    const user = await userModel.findById(userId)
    if (!user) return next(new Error(`User not found.`, { cause: 404 }))
    const { username, phone, address, gender, newPassword, oldPassword } = req.body
    username && (user.username = username)
    phone && (user.phone = phone)
    address && (user.address = address)
    gender && (user.gender = gender)
    if (req.file) {
        const { public_id, secure_url } = await cloudinaryUploadImage(req.file.path, `${process.env.APP_NAME}/users`)
        if (user.image.public_id) await cloudinaryRemoveImage(user.image.public_id)
        user.image = { public_id, secure_url }
    }
    if ((newPassword && !oldPassword) || (!newPassword && oldPassword)) {
        return next(new Error(`Please provide old password and new password.`, { cause: 400 }))
    }
    if (newPassword && oldPassword) {
        const isMatch = await bcrypt.compare(oldPassword, user.password)
        if (!isMatch) return next(new Error(`Old password is not correct.`, { cause: 400 }))
        user.password = await bcrypt.hash(newPassword, parseInt(process.env.SALT_ROUND))
        user.changePasswordTime = Date.now()
    }
    await user.save()
    return res.status(200).json({ message: 'success' })
})
/** ----------------------------------------------------------------
 * @desc add product to wishlist
 * @route /users/wishlist/:id
 * @method PATCH
 * @access logged in user
 * -----------------------------------------------------------------
 */
export const addProductToWishlist = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const product = await productModel.findById(id)
    if (!product) return next(new Error(`Product with id '${id}' not found.`, { cause: 404 }))
    const user = await userModel.findById(req.user._id)
    if (!user) return next(new Error(`User not found.`, { cause: 404 }))
    if (user.wishList.includes(product._id)) {
        user.wishList = user.wishList.filter((productId) => productId.toString() !== product._id.toString()) // remove product
    } else {
        user.wishList.push(product._id) // add product
    }
    await user.save()
    return res.status(200).json({ message: 'success' })
})
/** ----------------------------------------------------------------
 * @desc get all users
 * @route /users
 * @method GET
 * @access admin
 * -----------------------------------------------------------------
 */
export const getAllUsers = asyncHandler(async (req = request, res = response) => {
    const { limit, skip } = pagination(req.query)
    const searchObj = getSearchQuery(req.query?.search, 'username', 'email')
    const sortString = getSortQuery(req.query.sort)
    const selectString = req.query.select ? getSelectQuery(req.query.select) : '-password -code -changePasswordTime'
    const finalSelectString = selectString.includes('-password')
        ? selectString
        : selectString.includes('password')
          ? selectString
                .split(' ')
                .filter((el) => el !== 'password')
                .join(' ')
          : selectString

    const users = await userModel
        .find({ ...searchObj, _id: { $ne: req.user._id } })
        .skip(skip)
        .limit(limit)
        .sort(sortString)
        .select(finalSelectString)

    const totalResultsCounts = (await userModel.find({ ...searchObj, _id: { $ne: req.user._id } })).length

    const totalCount = await userModel.estimatedDocumentCount()

    return res.json({
        message: 'success',
        totalCount,
        resultCount: users.length,
        totalResultsCounts,
        users,
    })
})
/** ----------------------------------------------------------------
 * @desc change user role & status
 * @route /users/:id
 * @method PATCH
 * @access admin
 * -----------------------------------------------------------------
 */
export const changeUserRoleAndStatus = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const { status, role } = req.body
    const user = await userModel.findById(id)
    if (!user) return next(new Error(`User with id '${id}' not found.`, { cause: 404 }))
    if (status) {
        if (user.role === admin && status === 'Inactive') {
            return next(new Error(`Admin can't be deactivated.`, { cause: 400 }))
        }
        user.status = status
    }
    if (role) {
        user.role = role
    }
    await user.save()
    return res.status(200).json({ message: 'success' })
})
/** ----------------------------------------------------------------
 * @desc delete user
 * @route /users/:id
 * @method DELETE
 * @access admin
 * -----------------------------------------------------------------
 */
export const deleteUser = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const user = await userModel.findById(id)
    if (!user) return next(new Error(`User not found.`, { cause: 404 }))
    await user.deleteOne()
    return res.status(200).json({ message: 'success', userId: user._id })
})