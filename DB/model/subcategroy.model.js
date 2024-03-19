import mongoose, { Schema, Types, model } from 'mongoose'
import { cloudinaryRemoveImage } from '../../src/utils/cloudinary.js'
import productModel from './product.model.js'

const subcategorySchema = new Schema(
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
        image: {
            type: Object,
            required: true,
        },
        status: {
            type: String,
            enum: ['Active', 'Inactive'],
            default: 'Active',
        },
        categoryId: {
            type: Types.ObjectId,
            ref: 'Category',
            required: true,
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
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
    }
)

subcategorySchema.virtual('products', {
    ref: 'Product',
    localField: '_id',
    foreignField: 'subcategoryId',
})

subcategorySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        // delete subcategory image
        await cloudinaryRemoveImage(this.image.public_id)
        // loop for all products that belong to this subcategory and delete its images and its fields from database
        const products = await productModel.find({ subcategoryId: this._id })
        for (let product of products) {
            await product.deleteOne()
        }
        next()
    } catch (error) {
        next(error)
    }
})

const subcategoryModel = mongoose.models.Subcategory || model('Subcategory', subcategorySchema)

export default subcategoryModel
