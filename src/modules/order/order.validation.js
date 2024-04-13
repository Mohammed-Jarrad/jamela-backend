import joi from 'joi'
import { generalFields } from '../../middlewares/validation.js'

export const create = joi.object({
    couponName: joi.string().max(10).optional().allow(''),
    paymentType: joi.string().valid('cash', 'card'),
    address: joi.string().required(),
    phoneNumber: joi.string().required(),
    note: joi.string().max(300).optional(),
})

export const getOrdersForUser = joi.object({
    select: joi.string().optional(),
    sort: joi.string().optional(),
    page: joi.number().positive().min(1),
    limit: joi.number().positive().min(1),
    // i need to allow add another keys here

}).unknown(true)

export const cancel = joi.object({
    id: generalFields.id.required(),
    note: joi.string(),
})
export const get = joi.object({
    id: generalFields.id.required(),
})

export const changeStatus = joi.object({
    id: generalFields.id.required(),
    status: joi.string().valid('pending', 'confirmed', 'onWay', 'delivered', 'cancelled').required(),
    reasonRejected: joi.string().max(300)
})

export const changeCoupon = joi.object({
    id: generalFields.id.required(),
    couponName: joi.string().max(10).optional()
})
export const removeCoupon = joi.object({
    id: generalFields.id.required(),
})

export const editNote = joi.object({
    id: generalFields.id.required(),
    note: joi.string().max(300)
})