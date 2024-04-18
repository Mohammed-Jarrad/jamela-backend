import mongoose, { Schema, Types, model } from 'mongoose'
import { cloudinaryRemoveImage } from '../../src/utils/cloudinary.js'
import { sizesEnum } from '../../src/utils/constants.js'

const productSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        slug: {
            type: String,
            lowercase: true,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        stock: {
            type: Number,
            default: 1,
        },
        price: {
            type: Number,
            required: true,
        },
        discount: {
            type: Number,
            default: 0,
        },
        finalPrice: {
            type: Number,
        },
        sizes: {
            type: [String],
            enum: sizesEnum,
        },
        colors: {
            type: [String],
        },
        isNewArrival: {
            type: Boolean,
            default: false,
        },
        averageRating: {
            type: Number,
            default: 0,
        },
        mainImage: {
            type: Object,
            required: true,
        },
        subImages: {
            type: [Object],
            required: true,
        },
        number_sellers: {
            type: Number,
            default: 0,
        },
        categoryId: {
            type: Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        subcategoryId: {
            type: Types.ObjectId,
            ref: 'Subcategory',
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
        },
        createdBy: {
            type: Types.ObjectId,
            ref: 'User',
            required: true,
        },
        updatedBy: {
            type: Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
)

productSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        // delete all sub images
        for (let subImage of this.subImages) {
            await cloudinaryRemoveImage(subImage.public_id)
        }
        // delete main image
        await cloudinaryRemoveImage(this.mainImage.public_id)
        next()
    } catch (error) {
        next(error)
    }
})

const Product = mongoose.models.Product || model('Product', productSchema)

export default Product
