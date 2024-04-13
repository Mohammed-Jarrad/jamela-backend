import mongoose, { Schema, Types, model } from 'mongoose'

const couponSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        usedBy: [
            {
                type: Types.ObjectId,
                ref: 'User',
            },
        ],
        expireDate: {
            type: Date,
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
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

const Coupon = mongoose.models.Coupon || model('Coupon', couponSchema)

export default Coupon
