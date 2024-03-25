import mongoose, { Schema, Types, model } from 'mongoose'
import { sizesEnum } from "../../src/utils/constants.js"

const orderSchema = new Schema(
    {
        userId: {
            type: Types.ObjectId,
            ref: 'User',
            required: true,
        },
        products: {
            type: [
                {
                    productId: { type: Types.ObjectId, ref: 'Product', required: true },
                    quantity: { type: Number, required: true, default: 1 },
					size: { type: String, enum: sizesEnum },
					color: { type: String },
                    unitPrice: { type: Number, required: true },
                    finalPrice: { type: Number, required: true },
                    name: { type: String, required: true },
                },
            ],
            required: true,
        },
        couponName: {
            type: String,
        },
        finalPrice: {
            type: Number,
            required: true,
        },
        address: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
        },
        paymentType: {
            type: String,
            enum: ['cart', 'cash'],
            default: 'cash',
        },
        status: {
            type: String,
            default: 'pending',
            enum: ['pending', 'confirmed', 'onWay', 'delivered', 'cancelled'],
        },
        reasonRejected: {
			type: String
		},
        note: {
			type: String
		},
        updatedBy: {
            type: Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true,
    }
)

const orderModel = mongoose.models.Order || model('Order', orderSchema)

export default orderModel
