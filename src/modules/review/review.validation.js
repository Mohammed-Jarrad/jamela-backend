import joi from 'joi'
import { generalFields } from '../../middlewares/validation.js'

export const create = joi.object({
    rating: joi.number().integer().min(1).max(5).required(),
    comment: joi.string().max(300).required(),
    productId: generalFields.id.required(),
})

export const update = joi.object({
    id: generalFields.id.required(),
    rating: joi.number().integer().min(1).max(5),
    comment: joi.string().max(300),
})

export const deleteOne = joi.object({
    id: generalFields.id.required(),
})

