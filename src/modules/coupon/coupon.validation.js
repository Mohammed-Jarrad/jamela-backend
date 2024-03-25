import joi from 'joi'
import { generalFields } from '../../middlewares/validation.js'

export const create = joi.object({
    name: joi.string().max(10).required().label('Coupon name'),
    amount: joi.number().positive().required().label('Coupon amount'),
    expireDate: joi.date().greater('now').required().label('Coupon expire date'),
})

export const update = joi.object({
    name: joi.string().max(10).label('Coupon name'),
    amount: joi.number().positive().label('Coupon amount'),
    expireDate: joi.date().greater('now').label('Coupon expire date').messages({
        'date.greater': 'Coupon expire date must be greater than current date',
    }),
    id: generalFields.id.required(),
})

export const getSingle = joi.object({
    id: generalFields.id.required(),
})

export const checkCoupon = joi.object({
    couponName: joi.string().max(10).required().label('Coupon name'),
})
