import { request, response } from 'express'
import Review from '../../../DB/model/review.model.js'
import { asyncHandler } from "../../utils/error.js"

/** ---------------------------------------
 * @desc get all reviews
 * @route /reviews
 * @method GET
 * @access only admin
 * ----------------------------------------
 */
export const getAll = asyncHandler(async (req = request, res = response, next) => {
    const reviews = await Review.find().populate([
        { path: 'userId', select: 'username email image' },
        { path: "productId", select: "name mainImage" },
    ])
    return res.status(200).json({ message: 'success', reviews })
})

/** ----------------------------------------
 * @desc create new review
 * @route /reviews
 * @method POST
 * @access only user
 * -----------------------------------------
 */
export const create = asyncHandler(async (req = request, res = response, next) => {
    const userId = req.user._id
    const { rating, comment, productId } = req.body
    // i need to allow user to create just one review on one product
    const review = await Review.findOne({ userId, productId })
    if (review) return next(new Error(`You have already reviewed this product.`, { cause: 400 }))
    const newReview = await Review.create({ userId, productId, rating, ...(comment && { comment }) })
    return res.status(201).json({ message: 'success', review: newReview })
})
/** ----------------------------------------
 * @desc update review
 * @route /reviews/:id
 * @method PUT
 * @access only user
 * -----------------------------------------
 */
export const update = asyncHandler(async (req = request, res = response, next) => {
    const { id: reviewId } = req.params
    const { rating, comment } = req.body
    const { _id: userId } = req.user
    const review = await Review.findOne({ userId, _id: reviewId })
    // check if review founded
    if (!review) return next(new Error(`Review not found or access denied.`, { cause: 404 }))
    // update the review
    const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        {
            ...(rating && { rating }),
            ...(comment && { comment }),
        },
        { new: true }
    )
    return res.status(200).json({ message: 'success', review: updatedReview })
})
/** ----------------------------------------
 * @desc delete review
 * @route /reviews/:id
 * @method DELETE
 * @access only the owner of the review or admin
 * -----------------------------------------
 */
export const deleteReview = asyncHandler(async (req = request, res = response, next) => {
    const { id: reviewId } = req.params
    const { _id: userId, role } = req.user
    const review = await Review.findOne({
        ...(role !== 'Admin' && { userId }),
        _id: reviewId,
    })
    // check if review founded
    if (!review) return next(new Error(`Review not found or access denied.`, { cause: 404 }))
    // delete the review
    await review.deleteOne()
    return res.status(200).json({ message: 'success' })
})
