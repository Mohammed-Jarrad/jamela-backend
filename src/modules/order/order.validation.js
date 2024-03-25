import joi from 'joi'
import { generalFields } from '../../middlewares/validation.js'

export const create = joi.object({
    couponName: joi.string().max(10).optional().allow(''),
    paymentType: joi.string().valid('cash', 'card'),
    address: joi.string().required(),
    phoneNumber: joi.string().required(),
    note: joi.string().optional(),
})

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