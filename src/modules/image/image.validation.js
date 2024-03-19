import joi from 'joi'
import { generalFields } from '../../middlewares/validation.js'

export const create = joi.object({
    file: generalFields.file.required().label('image file'),
    link: joi.string().optional(),
    imageType: joi.string().valid('main', 'banner').required().label('image type'),
})
export const update = joi.object({
    file: generalFields.file.label('image file'),
    link: joi.string().allow("").optional().label('image link'),
    imageType: joi.string().valid('main', 'banner').label('image type'),
    id: generalFields.id.required(),
})
export const getAll = joi.object({
    imageType: joi.string().valid('main', 'banner').optional().label('image type'),
})
export const withID = joi.object({
    id: generalFields.id.required(),
})
