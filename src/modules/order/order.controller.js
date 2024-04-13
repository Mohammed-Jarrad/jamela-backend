import { request, response } from 'express'
import Cart from '../../../DB/model/cart.model.js'
import Coupon from '../../../DB/model/coupon.model.js'
import Order from '../../../DB/model/order.model.js'
import Product from '../../../DB/model/product.model.js'
import { getFormatQuery, getSelectQuery, getSortQuery } from '../../utils/apiFilter.js'
import { asyncHandler } from '../../utils/error.js'
import { pagination } from '../../utils/pagination.js'
import { checkCouponService } from '../coupon/coupon.service.js'

/**------------------------------------------
 * @desc create new order
 * @route /orders
 * @method POST
 * @access only admin
 * ------------------------------------------
 */
export const createOrder = asyncHandler(async (req = request, res = response, next) => {
    const userId = req.user._id
    const { couponName, paymentType, address, phoneNumber, note } = req.body
    // check cart
    const cart = await Cart.findOne({ userId })
    if (!cart) return next(new Error('Cart not found.', { cause: 404 }))
    if (cart.products.length === 0) return next(new Error('Cart is empty.', { cause: 400 }))
    // add cart products to the new order
    req.body.products = cart.products
    // check coupon
    let coupon
    if (couponName) {
        const { coupon: couponObj, message, statusCode } = await checkCouponService(couponName, userId)
        if (!couponObj) return next(new Error(message, { cause: statusCode }))
        else coupon = couponObj
    }
    // check the products
    let subTotals = 0
    let finalProductsList = []
    for (const cartItem of req.body.products) {
        const { name: productName } = await Product.findById(cartItem.productId).select('name')
        const _product = await Product.findOne({
            _id: cartItem.productId,
            stock: { $gte: cartItem.quantity },
        })
        if (!_product) {
            return next(new Error(`${productName} quantity not available`, { cause: 400 }))
        }
        const updatedProduct = {
            ...cartItem.toObject(),
            name: _product.name,
            unitPrice: _product.finalPrice,
            discount: _product.discount,
            finalPrice: _product.finalPrice * cartItem.quantity,
        }
        subTotals += updatedProduct.finalPrice
        finalProductsList.push(updatedProduct)
    }
    // create the order
    const order = await Order.create({
        userId,
        products: finalProductsList,
        finalPrice: subTotals - (subTotals * (coupon?.amount ?? 0)) / 100,
        address,
        phoneNumber,
        ...(paymentType && { paymentType }), // add payment type if founded
        ...(note && { note }), // add note if founded
        ...(couponName && { couponName }), // add the coupon name if founded
    })
    // change the stock of each product in the database
    for (const cartItem of req.body.products) {
        await Product.updateOne({ _id: cartItem.productId }, { $inc: { stock: -1 * cartItem.quantity } })
    }
    // add the user to usedBy list in the coupon it the coupon used
    if (coupon) {
        await Coupon.updateOne({ _id: coupon._id }, { $addToSet: { usedBy: userId } })
    }
    // clear the cart
    await Cart.updateOne({ userId }, { products: [] })
    // return the response
    return res.status(201).json({ message: 'success', order })
})

/**------------------------------------------
 * @desc cancel order
 * @route /orders/:id
 * @method PATCH
 * @access only user
 * ------------------------------------------
 */
export const cancelOrder = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const order = await Order.findOne({ _id: id, userId: req.user._id })
    if (!order) return next(new Error(`Invalid order or order not found.`, { cause: 404 }))
    if (order.status != 'pending') return next(new Error(`You can't cancel this order.`, { cause: 409 }))
    const updateObj = {
        status: 'cancelled',
        updatedBy: req.user._id,
        ...(req.body.note && { note: req.body.note }),
    }
    const updatedOrder = await Order.findByIdAndUpdate(id, updateObj, { new: true })
    // increase the stock of each product
    for (let orderItem of order.products) {
        await Product.updateOne({ _id: orderItem.productId }, { $inc: { stock: orderItem.quantity } })
    }
    // remove the user from usedBy list in the coupon
    if (order.couponName) {
        await Coupon.updateOne({ name: order.couponName }, { $pull: { usedBy: order.userId } })
    }
    return res.status(200).json({ message: 'success', order: updatedOrder })
})

/**------------------------------------------
 * @desc get orders for user
 * @route /orders/user
 * @method GET
 * @access only user
 * ------------------------------------------
 */
export const getOrdersForUser = asyncHandler(async (req = request, res = response, next) => {
    const { limit, skip } = pagination(req.query)
    const formatObj = getFormatQuery(req.query)
    const sortString = getSortQuery(req.query.sort)
    const selectString = getSelectQuery(req.query.select)

    const orders = await Order
        .find({ userId: req.user._id, ...formatObj })
        .skip(skip)
        .limit(limit)
        .sort(sortString)
        .select(selectString)

    const totalCount = await Order.find({ userId: req.user._id }).countDocuments()
    const totalResultsCounts = await Order.find({ userId: req.user._id, ...formatObj }).countDocuments()
    return res
        .status(200)
        .json({ message: 'success', totalCount, resultCount: orders.length, totalResultsCounts, orders })
})

/**------------------------------------------
 * @desc get all orders
 * @route /orders
 * @method GET
 * @access only admin
 * ------------------------------------------
 */
export const getAllOrders = asyncHandler(async (req = request, res = response, next) => {
    const { limit, skip } = pagination(req.query)
    const formatObj = getFormatQuery(req.query)
    const sortString = getSortQuery(req.query.sort)
    const selectString = getSelectQuery(req.query.select)

    const orders = await Order
        .find(formatObj)
        .skip(skip)
        .limit(limit)
        .sort(sortString)
        .select(selectString)
        .populate('userId', 'username email image')

    const totalCount = await Order.find().countDocuments()
    const totalResultsCounts = await Order.find(formatObj).countDocuments()
    return res
        .status(200)
        .json({ message: 'success', totalCount, resultCount: orders.length, totalResultsCounts, orders })
})

/**------------------------------------------
 * @desc get order
 * @route /orders/:id
 * @method GET
 * @access only user and admin
 * ------------------------------------------
 */
export const getOrder = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const { role, _id: userId } = req.user

    const order = await Order
        .findOne({
            _id: id,
            ...(role !== 'Admin' && { userId }),
        })
        .populate('products.productId')
        .populate('userId', 'username email image')

    if (!order) {
        return next(
            new Error(role === 'Admin' ? `Order not found.` : `Access denied.`, { cause: role === 'Admin' ? 404 : 403 })
        )
    }

    return res.status(200).json({ message: 'success', order })
})

/**------------------------------------------
 * @desc change order status
 * @route /orders/change-status/:id
 * @method PATCH
 * @access only admin
 * ------------------------------------------
 */
export const changeStatus = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const { status, reasonRejected } = req.body
    const order = await Order.findById(id)
    // check if order founded
    if (!order) return next(new Error(`Order not found.`, { cause: 404 }))
    // check if status didn't change
    if (order.status === status && !reasonRejected) return next(new Error(`Same status, can't change.`))
    // check if status === 'delivered'
    if (order.status === 'delivered') return next(new Error(`Can't change status.`))
    const updatedObj = {
        status,
        updatedBy: req.user._id,
        ...(status === 'cancelled' && reasonRejected && { reasonRejected }), // if status === 'cancelled' => add reasonRejected
    }
    // update the order
    const updatedOrder = await Order.findByIdAndUpdate(id, updatedObj, { new: true })
    // check the old orders status if cancelled => update the coupon usedBy list and decrease the stock of each product
    if (order.status == 'cancelled') {
        if (order.couponName)
            await Coupon.updateOne({ name: order.couponName }, { $push: { usedBy: order.userId } })
        for (let orderItem of order.products)
            await Product.updateOne({ _id: orderItem.productId }, { $inc: { stock: -1 * orderItem.quantity } })
    }
    // check if the status === 'cancelled' and remove the user from usedBy list in the coupon and decrease the stock of each product
    if (status === 'cancelled') {
        for (let orderItem of order.products)
            await Product.updateOne({ _id: orderItem.productId }, { $inc: { stock: orderItem.quantity } })
        if (order.couponName)
            await Coupon.updateOne({ name: order.couponName }, { $pull: { usedBy: order.userId } })
    }
    // if status === 'delivered' => update the number_sellers of each product
    if (status == 'delivered') {
        for (let orderItem of order.products) {
            await Product.updateOne({ _id: orderItem.productId }, { $inc: { number_sellers: 1 } })
        }
    }
    // return the updated order
    return res.status(200).json({ message: 'success', order: updatedOrder })
})

/**------------------------------------------
 * @desc change order coupon
 * @route /orders/change-coupon/:id
 * @method PATCH
 * @access only user
 * ------------------------------------------
 */
export const changeOrderCoupon = asyncHandler(async (req = request, res = response, next) => {
    const { id: orderId } = req.params
    const { couponName } = req.body
    const { _id: userId } = req.user
    const order = await Order.findById(orderId)
    // check if order founded
    if (!order) return next(new Error(`Order not found .`, { cause: 404 }))
    // check if user the owner of the order
    if (order.userId.toString() !== userId.toString()) return next(new Error(`Access denied.`, { cause: 403 }))
    // check if the order status !== 'pending' => can't change coupon
    if (order.status !== 'pending') return next(new Error(`Can't change coupon.`, { cause: 400 }))
    // check if couponName didn't change
    if (order.couponName && order.couponName === couponName) return next(new Error(`Same coupon, can't change.`))
    // check if user used this coupon
    const { coupon, message, statusCode } = await checkCouponService(couponName, userId)
    if (!coupon) {
        return next(new Error(message, { cause: statusCode || 400 }))
    }
    // change the final price for order
    let total = 0
    for (let orderItem of order.products) {
        total += orderItem.finalPrice * orderItem.quantity
    }
    const finalPrice = (total - (total * coupon.amount) / 100).toFixed(2)
    // update the order
    const updatedOrder = await Order.findByIdAndUpdate(orderId, { couponName, finalPrice }, { new: true })
    // add the userId to usedBy list in the coupon
    await Coupon.updateOne({ name: couponName }, { $addToSet: { usedBy: userId } })
    // remove the user from usedBy list in the old coupon
    if (order.couponName) {
        await Coupon.updateOne({ name: order.couponName }, { $pull: { usedBy: userId } })
    }

    return res.status(200).json({ message: 'success', order: updatedOrder })
})
/**------------------------------------------
 * @desc remove order coupon
 * @route /orders/remove-coupon/:id
 * @method PATCH
 * @access only user
 * ------------------------------------------
 */
export const removeOrderCoupon = asyncHandler(async (req = request, res = response, next) => {
    const { id: orderId } = req.params
    const { _id: userId } = req.user
    const order = await Order.findById(orderId)
    // check if order founded
    if (!order) return next(new Error(`Order not found .`, { cause: 404 }))
    // check if user the owner of the order
    if (order.userId.toString() !== userId.toString()) return next(new Error(`Access denied.`, { cause: 403 }))
    // check if the order status !== 'pending' => can't remove coupon
    if (order.status !== 'pending') return next(new Error(`Can't remove coupon.`, { cause: 400 }))
    // change the final price for order
    const finalPrice = order.products
        .reduce((total, { finalPrice, quantity }) => {
            return total + finalPrice * quantity
        }, 0)
        .toFixed(2)
    // update the order
    const updatedOrder = await Order.findByIdAndUpdate(orderId, { couponName: null, finalPrice }, { new: true })
    // remove the userId from usedBy list in the coupon
    await Coupon.updateOne({ name: order.couponName }, { $pull: { usedBy: userId } })
    return res.status(200).json({ message: 'success', order: updatedOrder })
})
/**------------------------------------------
 * @desc change order note
 * @route /orders/update-note/:id
 * @method PATCH
 * @access only user
 * ------------------------------------------
 */
export const updateOrderNote = asyncHandler(async (req = request, res = response, next) => {
    const { id: orderId } = req.params
    const { note } = req.body
    const { _id: userId } = req.user
    const order = await Order.findById(orderId)
    // check if order founded
    if (!order) return next(new Error(`Order not found.`, { cause: 404 }))
    if (order.status !== 'pending') return next(new Error(`Can't change note.`, { cause: 400 }))
    // check if user the owner of the order
    if (order.userId.toString() !== userId.toString()) return next(new Error(`Access denied.`, { cause: 403 }))
    // update the order
    const updatedOrder = await Order.findByIdAndUpdate(orderId, { note }, { new: true })
    return res.status(200).json({ message: 'success', order: updatedOrder })
})
/**------------------------------------------
 * @desc delete order
 * @route /orders/:id
 * @method DELETE
 * @access only admin
 * ------------------------------------------
 */
export const deleteOrder = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const order = await Order.findByIdAndDelete(id)
    if (!order) return next(new Error(`Order not found.`, { cause: 404 }))

    return res.status(200).json({ message: 'success', orderId: order._id })
})

/**------------------------------------------
 * @desc accept all pending orders
 * @route /orders/accept-all
 * @method PATCH
 * @access only admin
 * ------------------------------------------
 */
export const acceptAllOrders = asyncHandler(async (req = request, res = response, next) => {
    const orders = await Order.updateMany({ status: 'pending' }, { status: 'delivered' })
    return res.status(200).json({ message: 'success', orders })
})