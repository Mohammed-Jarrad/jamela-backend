import mongoose, { Schema, Types, model } from 'mongoose'
import { sizesEnum } from '../../src/utils/constants.js'

const cartSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        products: [
            {
                productId: { type: Types.ObjectId, ref: 'Product', required: true },
                quantity: { type: Number, default: 1 },
                size: {
                    type: String,
                    enum: sizesEnum,
                },
                color: String,
            },
        ],
    },
    {
        timestamps: true,
    }
)

const cartModel = mongoose.models.Cart || model('Cart', cartSchema)

export default cartModel
