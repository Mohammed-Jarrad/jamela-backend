import mongoose, { Schema, Types, model } from 'mongoose'
import { cloudinaryRemoveImage } from '../../src/utils/cloudinary.js'
import brandModel from './brand.model.js'
import Cart from './cart.model.js'
import Category from './category.model.js'
import Coupon from './coupon.model.js'
import Order from './order.model.js'
import Product from './product.model.js'
import Subcategory from './subcategroy.model.js'

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            min: 3,
            max: 35,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            min: 6,
        },
        image: {
            type: Object,
            default: {
                secure_url:
                    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQanlasPgQjfGGU6anray6qKVVH-ZlTqmuTHw&usqp=CAU',
                public_id: null,
            },
        },
        wishList: {
            type: [
                {
                    type: Types.ObjectId,
                    ref: 'Product',
                },
            ],
            default: [],
        },
        phone: {
            type: String,
            // required: true
        },
        address: {
            type: String,
            // required: true
        },
        confirmEmail: {
            type: Boolean,
            default: false,
        },
        gender: {
            type: String,
            enum: ['Male', 'Female'],
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
        },
        role: {
            type: String,
            enum: ['User', 'Admin'],
            default: 'User',
        },
        code: {
            type: String,
            default: null,
        },
        changePasswordTime: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
)

userSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        // delete user image
        if (this.image.public_id) await cloudinaryRemoveImage(this.image.public_id)
        // delete user cart
        await Cart.deleteOne({ userId: this._id })
        // delete assosiated categories
        const categories = await Category.find({ createdBy: this._id })
        for (let category of categories) await category.deleteOne()
        // delete assosiated subcategories
        const subcategories = await Subcategory.find({ createdBy: this._id })
        for (let subcategory of subcategories) await subcategory.deleteOne()
        // delete assosiated products
        const products = await Product.find({ createdBy: this._id })
        for (let product of products) await product.deleteOne()
        // delete assosiated brands
        const brands = await brandModel.find({ createdBy: this._id })
        for (let brand of brands) await brand.deleteOne()
        // delete assosiated orders
        await Order.deleteMany({ userId: this._id })
        // delete assosiated coupons
        await Coupon.deleteMany({ userId: this._id })
        next()
    } catch (error) {
        next(error)
    }
})

const User = mongoose.models.User || model('User', userSchema)

export default User
