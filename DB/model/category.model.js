import mongoose, { Schema, Types, model } from 'mongoose'
import { cloudinaryRemoveImage } from '../../src/utils/cloudinary.js'
import subcategoryModel from './subcategroy.model.js'

const categorySchema = new Schema(
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
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
)

categorySchema.virtual('subcategories', {
    ref: 'Subcategory',
    foreignField: 'categoryId',
    localField: '_id',
})

categorySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        // delete category image
        await cloudinaryRemoveImage(this.image.public_id)
        // delete all subcategories that belong to this category
        const subcategories = await subcategoryModel.find({ categoryId: this._id })
        for (let subcategory of subcategories) {
            await subcategory.deleteOne()
        }
        next()
    } catch (error) {
        next(error)
    }
})

const categoryModel = mongoose.models.Category || model('Category', categorySchema)

export default categoryModel
