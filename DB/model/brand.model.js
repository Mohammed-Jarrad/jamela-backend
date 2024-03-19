import mongoose, { Schema, Types, model } from 'mongoose'
import { cloudinaryRemoveImage } from '../../src/utils/cloudinary.js'

const brandSchema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        slug: { type: String, required: true },
        image: { type: Object, required: true },
        status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
        createdBy: { type: Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
)

brandSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        // delete brand image
        await cloudinaryRemoveImage(this.image.public_id)
        next()
    } catch (error) {
        next(error)
    }
})
const brandModel = mongoose.models.Brand || model('Brand', brandSchema)

export default brandModel
