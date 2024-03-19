import mongoose, { Schema, Types, model } from 'mongoose'

const orderSchema = new Schema(
	{
		userId: {
			type: Types.ObjectId,
			ref: 'User',
			required: true,
		},
		products: [
			{
				productId: { type: Types.ObjectId, ref: 'Product', required: true },
				quantity: { type: Number, required: true, default: 1 },
				unitPrice: { type: Number, required: true },
				finalPrice: { type: Number, required: true },
                name: { type: String, required: true }
			},
		],
		couponName: {
			type: String,
		},
        finalPrice: {
            type: Number,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
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
        reasonRejected: String,
        note: String,
        updatedBy: {
            type: Types.ObjectId,
            ref: "User"
        }
	},
	{
		timestamps: true,
	},
)

const orderModel = mongoose.models.Order || model('Order', orderSchema)

export default orderModel
