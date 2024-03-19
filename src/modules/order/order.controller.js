import { request, response } from 'express'
import cartModel from '../../../DB/model/cart.model.js'
import couponModel from '../../../DB/model/coupon.model.js'
import orderModel from '../../../DB/model/order.model.js'
import productModel from '../../../DB/model/product.model.js'
import userModel from '../../../DB/model/user.model.js'
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
    const user = await userModel.findById(userId)
    // check cart
    const cart = await cartModel.findOne({ userId })
    if (!cart) return next(new Error('Cart not found.', { cause: 404 }))
    if (cart.products.length === 0) return next(new Error('Cart is empty.', { cause: 400 }))
    // add cart products to the new order
    req.body.products = cart.products
    // check coupon
    let coupon
    if (couponName) {
        const { coupon, message, statusCode } = await checkCouponService(couponName, userId)
        if (!coupon) return next(new Error(message, { cause: statusCode }))
        else coupon = coupon
    }
    // check the products
    let subTotals = 0
    const finalProductsList = []
    for (const product of req.body.products) {
        const { name: productName } = await productModel.findById(product.productId).select('name')
        const checkProduct = await productModel.findOne({
            _id: product.productId,
            stock: { $gte: product.quantity },
        })
        if (!checkProduct) {
            return next(new Error(`${productName} quantity not available`, { cause: 400 }))
        }
        const updatedProduct = {
            ...product.toObject(),
            name: checkProduct.name,
            unitPrice: checkProduct.price,
            discount: checkProduct.discount,
            finalPrice: checkProduct.finalPrice * product.quantity,
        }
        subTotals += updatedProduct.finalPrice
        finalProductsList.push(updatedProduct)
    }
    // create the order
    const order = await orderModel.create({
        userId,
        products: finalProductsList,
        finalPrice: subTotals - (subTotals * (coupon?.amount ?? 0)) / 100,
        address: address || user.address,
        phoneNumber: phoneNumber || user.phone,
        ...(paymentType && { paymentType }), // add payment type if founded
        ...(note && { note }), // add note if founded
        ...(couponName && { couponName }), // add the coupon name if founded
    })
    // change the stock of each product in the database
    for (const product of req.body.products) {
        await productModel.updateOne(
            { _id: product.productId },
            { $inc: { stock: -1 * product.quantity } }
        )
    }
    // add the user to usedBy list in the coupon it the coupon used
    if (couponName) {
        await couponModel.updateOne({ _id: coupon._id }, { $addToSet: { usedBy: userId } })
    }
    // clear the cart
    await cartModel.updateOne({ userId }, { products: [] })
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
    const order = await orderModel.findOne({ _id: id, userId: req.user._id })
    if (!order) return next(new Error(`Invalid order or order not found.`, { cause: 404 }))
    if (order.status != 'pending')
        return next(new Error(`Order already cancelled.`, { cause: 409 }))
    const updateObj = {
        status: 'cancelled',
        updatedBy: req.user._id,
        ...(req.body.note && { note: req.body.note }),
    }
    const updatedOrder = await orderModel.findByIdAndUpdate(id, updateObj, { new: true })
    // increase the stock of each product
    for (let product of order.products) {
        await productModel.updateOne(
            { _id: product.productId },
            { $inc: { stock: product.quantity } }
        )
    }
    // remove the user from usedBy list in the coupon
    if (order.couponName) {
        await couponModel.updateOne({ name: order.couponName }, { $pull: { usedBy: order.userId } })
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
    const ordersQuery = orderModel.find({ userId: req.user._id }).skip(skip).limit(limit)
    if (req.query.sort) ordersQuery.sort(req.query.sort.replaceAll(',', ' '))
    if (req.query.select) ordersQuery.select(req.query.select.replaceAll(',', ' '))
    const orders = await ordersQuery
    return res.status(200).json({ message: 'success', orders })
})

/**------------------------------------------
 * @desc get all orders
 * @route /orders
 * @method GET
 * @access only admin
 * ------------------------------------------
 */
export const getAllOrders = asyncHandler(async (req = request, res = response, next) => {
    const { sort, select, status } = req.query
    const { limit, skip } = pagination(req.query)
    const statusFilterObj = {
        ...(status && { status }),
    }
    const ordersQuery = orderModel.find(statusFilterObj).skip(skip).limit(limit)
    sort && ordersQuery.sort(sort.replaceAll(',', ' '))
    select && ordersQuery.select(select.replaceAll(',', ' '))
    const orders = await ordersQuery
    const totalCount = await orderModel.estimatedDocumentCount()
    return res
        .status(200)
        .json({ message: 'success', totalCount, resultCount: orders.length, orders })
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
    const order = await orderModel.findById(id).populate('products.productId')
    if (!order) return next(new Error(`Order not found.`, { cause: 404 }))
    if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'Admin')
        return next(new Error(`Access denied.`, { cause: 403 }))
    return res.status(200).json({ message: 'success', order })
})

/**------------------------------------------
 * @desc change order status
 * @route /orders/changeStatus/:id
 * @method PATCH
 * @access only admin
 * ------------------------------------------
 */
export const changeStatus = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const { status, reasonRejected } = req.body
    const order = await orderModel.findById(id)
    // check if order founded
    if (!order) return next(new Error(`Order not found.`, { cause: 404 }))
    // check if status === 'delivered'
    if (order.status === 'delivered') return next(new Error(`Can't change status.`))
    const updatedObj = {
        status,
        updatedBy: req.user._id,
        ...(status === 'cancelled' && reasonRejected ? { reasonRejected } : { reasonRejected: '' }), // check if status === 'cancelled' and add reasonRejected if founded
    }
    // update the order
    const updatedOrder = await orderModel.findByIdAndUpdate(id, updatedObj, { new: true })
    // check the old orders status if cancelled => update the coupon usedBy list and decrease the stock of each product
    if (order.status == 'cancelled') {
        if (order.couponName)
            await couponModel.updateOne(
                { name: order.couponName },
                { $push: { usedBy: order.userId } }
            )
        for (let product of order.products)
            await productModel.updateOne(
                { _id: product.productId },
                { $inc: { stock: -1 * product.quantity } }
            )
    }
    // check if the status === 'cancelled' and remove the user from usedBy list in the coupon and decrease the stock of each product
    if (status === 'cancelled') {
        for (let product of order.products)
            await productModel.updateOne(
                { _id: product.productId },
                { $inc: { stock: product.quantity } }
            )
        if (order.couponName)
            await couponModel.updateOne(
                { name: order.couponName },
                { $pull: { usedBy: order.userId } }
            )
    }
    // return the updated order
    return res.status(200).json({ message: 'success', order: updatedOrder })
})
