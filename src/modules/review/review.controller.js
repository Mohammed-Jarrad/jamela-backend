import { request, response } from 'express'
import Review from '../../../DB/model/review.model.js'
import { asyncHandler } from '../../utils/error.js'
import { pagination } from '../../utils/pagination.js'
import Product from '../../../DB/model/product.model.js'

/** ---------------------------------------
 * @desc get all reviews
 * @route /reviews
 * @method GET
 * @access all
 * ----------------------------------------
 */
export const getAll = asyncHandler(async (req = request, res = response, next) => {
    const { productId } = req.query
    const { limit, skip } = pagination(req.query)

    const reviews = await Review.find({
        ...(productId && { productId }),
    })
        .skip(skip)
        .limit(limit)
        .populate([
            { path: 'userId', select: 'username email image' },
            { path: 'productId', select: 'name mainImage' },
        ])

    // get total count of reviews without pagination to be used in pagination
    const totalResultsCounts = (await Review.find({ ...(productId && { productId }) })).length
    return res.status(200).json({
        message: 'success',
        reviews,
        totalResultsCounts,
        resultCount: reviews.length,
    })
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
    const newReview = await Review.create({ userId, productId, rating, comment })
    const product = await Product.findById(productId)
    // get the reviews for this product
    const totalReviews = await Review.find({ productId })
    const totalRating = totalReviews.reduce((acc, rev) => acc + rev.rating, 0)
    product.averageRating = totalRating / totalReviews.length
    // save the product
    await product.save()

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
    if (review.userId.toString() !== userId.toString()) return next(new Error(`Access denied.`, { cause: 400 }))
    // update the review
    const updatedReview = await Review.findByIdAndUpdate(
        reviewId,
        {
            ...(rating && { rating }),
            ...(comment && { comment }),
        },
        { new: true }
    )
    // update the product
    const product = await Product.findById(review.productId)
    const totalReviews = await Review.find({ productId: review.productId })
    const totalRating = totalReviews.reduce((acc, rev) => acc + rev.rating, 0)
    console.log(totalRating)
    console.log(totalReviews.length)
    product.averageRating = totalRating / totalReviews.length
    // save the product
    await product.save()
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
    console.log(review)
    // update the product
    const product = await Product.findById(review.productId)
    const totalReviews = (await Review.find({ productId: review.productId.toString() })) || []
    const totalRating = totalReviews.reduce((acc, rev) => acc + rev.rating, 0) || 0
    product.averageRating = totalRating / totalReviews.length || 0
    // save the product
    await product.save()
    // send response
    return res.status(200).json({ message: 'success' })
})
