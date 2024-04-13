import { request, response } from 'express'
import Coupon from '../../../DB/model/coupon.model.js'
import { getSearchQuery, getSelectQuery, getSortQuery } from '../../utils/apiFilter.js'
import { asyncHandler } from '../../utils/error.js'
import { pagination } from '../../utils/pagination.js'
import { checkCouponService } from './coupon.service.js'

export const createCoupon = asyncHandler(async (req = request, res = response, next) => {
    const { name } = req.body
    if (await Coupon.findOne({ name })) {
        return next(new Error(`Coupun name '${name}' already exists.`, { cause: 409 }))
    }
    req.body.expireDate = new Date(req.body.expireDate)
    req.body.createdBy = req.user._id
    const coupon = await Coupon.create(req.body)
    return res.status(200).json({ message: 'success', coupon })
})

export const getCoupons = asyncHandler(async (req, res = response) => {
    const { limit, skip } = pagination(req.query)
    const searchObj = getSearchQuery(req.query.search, 'name')
    const coupons = await Coupon
        .find(searchObj)
        .skip(skip)
        .limit(limit)
        .sort(getSortQuery(req.query.sort))
        .select(getSelectQuery(req.query.select))
        .populate({ path: 'createdBy', select: 'username' })
    // get total count of coupons without pagination to be used in pagination
    const totalResultsCounts = (await Coupon.find(searchObj)).length
    const totalCount = await Coupon.estimatedDocumentCount()

    return res.status(200).json({
        message: 'success',
        totalCount,
        resultCount: coupons.length,
        totalResultsCounts,
        coupons,
    })
})

export const getCoupon = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const coupon = await Coupon.findById(id).populate([
        { path: 'createdBy', select: 'username' },
        { path: 'updatedBy', select: 'username' },
    ])
    if (!coupon) return next(new Error(`Coupon with id '${id}' not found.`, { cause: 404 }))
    return res.status(200).json({ message: 'success', coupon })
})

export const updateCoupon = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const { name, amount, expireDate } = req.body
    const coupon = await Coupon.findById(id)
    if (!coupon) return next(new Error(`Coupon with id [${id}] not found.`, { cause: 404 }))
    if (name) {
        if (await Coupon.findOne({ name }).select('name'))
            return next(new Error(`Coupon ${name} is already exists.`, { cause: 409 }))
        coupon.name = name
    }
    if (amount) coupon.amount = amount
    if (expireDate) coupon.expireDate = new Date(expireDate)

    coupon.updatedBy = req.user._id
    await coupon.save()
    return res.status(200).json({ message: 'success', coupon })
})

export const softDelete = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const coupon = await Coupon.findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        { new: true }
    )
    if (!coupon) return next(new Error(`Coupon not found or already inactived.`, { cause: 404 }))
    return res.status(200).json({ message: 'success', coupon })
})

export const hardDelete = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const coupon = await Coupon.findOneAndDelete({ _id: id })
    if (!coupon) return next(new Error(`Coupon not found.`, { cause: 404 }))
    return res.status(200).json({ message: 'success', couponId: coupon._id })
})

export const restoreCoupon = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const coupon = await Coupon.findOneAndUpdate(
        { _id: id, isDeleted: true },
        { isDeleted: false },
        { new: true }
    )
    if (!coupon) return next(new Error(`Coupon not found or already restored.`, { cause: 404 }))
    return res.status(200).json({ message: 'success', coupon })
})

/* 
 * @desc check coupon
 * @access user logged in 
 * @route POST /coupon/checkCoupon
 */
export const checkCoupon = asyncHandler(async (req = request, res = response, next) => {
    const { couponName } = req.body
    const userId = req.user._id
    const { coupon, message, statusCode } = await checkCouponService(couponName, userId)
    if (!coupon) return next(new Error(message, { cause: statusCode }))
    else return res.status(statusCode).json({ message, coupon })
})


// clear coupon used by user 
export const clearCoupon = asyncHandler(async (req = request, res = response, next) => {
    const { id: couponId } = req.params
    const coupon = await Coupon.findById(couponId)
    if (!coupon) return next(new Error(`Coupon not found.`, { cause: 404 }))
    coupon.usedBy = []
    await coupon.save()
    return res.status(200).json({ message: 'success' })  
})