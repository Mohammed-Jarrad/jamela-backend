import { request, response } from 'express'
import cartModel from '../../../DB/model/cart.model.js'
import productModel from '../../../DB/model/product.model.js'
import { asyncHandler } from '../../utils/error.js'

// Helper functions
const validateProduct = async (userId, productId, quantity, color, size) => {
    const pro = await productModel.findById(productId)
    if (!pro) return { error: 'Product not found.', cause: 404 }
    
    const cart = await cartModel.findOne({ userId })
    let qtyInCart = 0
    if (cart) {
        for (const item of cart.products) {
            if (item.productId.toString() === productId) {
                qtyInCart += item.quantity
            }
        }
    }

    const finalStock = pro.stock - qtyInCart

    if (finalStock < quantity) return { error: 'Not enough stock', cause: 400 }
    if (pro.stock == 0) return { error: 'Out of stock', cause: 400 }

    if (pro.colors.length && !color) return { error: 'Please select a color.', cause: 400 }
    if (color && !pro.colors.includes(color)) return { error: 'Color not found.', cause: 404 }
    if (pro.sizes.length && !size) return { error: 'Please select a size.', cause: 400 }
    if (size && !pro.sizes.includes(size)) return { error: 'Size not found.', cause: 404 }

    return { error: null }
}
/** ----------------------------------------------------------------
     * @desc add to card or create
     * @route /carts
     * @method POST
     * @access logged in user
     ----------------------------------------------------------------
*/
export const createCartorAddToCart = asyncHandler(async (req = request, res = response, next) => {
    const { productId, quantity = 1, color, size } = req.body
    // validate product data and get product
    const validate_product = await validateProduct(req.user._id, productId, quantity, color, size)
    if (validate_product.error) return next(new Error(validate_product.error, { cause: validate_product.cause || 400 }))
    // check if user already have a cart
    const cart = await cartModel.findOne({ userId: req.user._id })
    //  create new cart if not found and add product to it
    if (!cart) {
        const newCart = await cartModel.create({
            userId: req.user._id,
            products: [
                {
                    productId,
                    quantity: quantity,
                    ...(color && { color }),
                    ...(size && { size }),
                },
            ],
        })
        return res.status(201).json({ message: 'success', cart: newCart })
    }
    // check if the product already exist in the cart
    const productIndex = cart.products.findIndex((item) => {
        if (item.productId.toString() !== productId) return false
        if (color && item.color !== color) return false
        if (size && item.size !== size) return false
        return true
    })
    // increase the quantity by 1
    if (productIndex !== -1) {
        cart.products[productIndex].quantity += quantity
    } else {
        // add new product to cart
        cart.products.push({
            productId,
            quantity,
            ...(color && { color }),
            ...(size && { size }),
        })
    }
    await cart.save() // save the cart
    return res.status(200).json({ message: 'success', cart }) // return the updated cart
})

/** ----------------------------------------------------------------
     * @desc remove item from cart
     * @route /carts/removeItem
     * @method PATCH
     * @access logged in user
     -----------------------------------------------------------------
*/
export const removeItem = asyncHandler(async (req = request, res = response, next) => {
    const { itemId } = req.body
    const cart = await cartModel.updateOne(
        { userId: req.user._id },
        {
            $pull: {
                products: { _id: itemId },
            },
        },
        { new: true }
    )
    if (!cart) return next(new Error(`Failed delete item from cart.`, { cause: 400 }))
    return res.status(200).json({ message: 'success', cart })
})

/** ----------------------------------------------------------------
     * @desc update quantity to cart item 
     * @route /carts/updateQuantity
     * @method PATCH
     * @access logged in user
     -----------------------------------------------------------------
*/
export const updateQuantity = asyncHandler(async (req = request, res = response, next) => {
    const { itemId, quantity } = req.body
    const cart = await cartModel.updateOne(
        { userId: req.user._id, 'products._id': itemId },
        {
            $set: { 'products.$.quantity': quantity },
        },
        { new: true }
    )
    if (!cart) return next(new Error(`Failed update quantity.`, { cause: 400 }))
    return res.status(200).json({ message: 'success', cart })
})

/** ----------------------------------------------------------------
     * @desc update size or color to cart item 
     * @route /carts/updateSizeOrColor
     * @method PATCH
     * @access logged in user
     -----------------------------------------------------------------
*/

export const updateSizeOrColor = asyncHandler(async (req = request, res = response, next) => {
    const { itemId, productId, size, color } = req.body
    const check = await cartModel.findOne({
        userId: req.user._id,
        products: {
            $elemMatch: {
                _id: { $ne: itemId },
                productId,
                ...(color && { color }),
                ...(size && { size }),
            },
        },
    })
    if (check) return next(new Error(`New variants already exist.`, { cause: 409 }))

    const cart = await cartModel.updateOne(
        { userId: req.user._id, 'products._id': itemId },
        {
            $set: {
                ...(color && { 'products.$.color': color }),
                ...(size && { 'products.$.size': size }),
            },
        },
        { new: true }
    )
    if (!cart) return next(new Error(`Failed update size or color.`, { cause: 400 }))
    return res.status(200).json({ message: 'success', cart })
})

/** ----------------------------------------------------------------
     * @desc clear cart
     * @route /carts/clearCart
     * @method PATCH
     * @access logged in user
     -----------------------------------------------------------------
*/

export const clearCart = asyncHandler(async (req = request, res = response, next) => {
    const cart = await cartModel.findOneAndUpdate({ userId: req.user._id }, { products: [] }, { new: true })
    if (!cart) return next(new Error(`Cart not found.`, { cause: 404 }))
    return res.status(200).json({ message: 'success', cart })
})

/** ----------------------------------------------------------------
     * @desc get cart
     * @route /carts
     * @method GET
     * @access logged in user
     -----------------------------------------------------------------
*/
export const get = asyncHandler(async (req = request, res = response, next) => {
    const cart = await cartModel.findOne({ userId: req.user._id }).populate({
        path: 'products',
        populate: {
            path: 'productId',
            populate: {
                path: 'categoryId',
                select: 'name',
            },
        },
    })
    if (!cart) return next(new Error(`Cart not found.`, { cause: 404 }))
    return res.status(200).json({ message: 'success', cart })
})

/** ----------------------------------------------------------------
     * @desc get all carts
     * @route /carts/getAll
     * @method GET
     * @access Admin only
     -----------------------------------------------------------------
*/
export const getAll = asyncHandler(async (req = request, res = response, next) => {
    const carts = await cartModel.find().populate({ path: 'products', populate: { path: 'productId' } })
    return res.status(200).json({ message: 'success', carts })
})
