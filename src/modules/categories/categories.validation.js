import joi from 'joi'
import { generalFields } from '../../middlewares/validation.js'

export const create = joi.object({
    name: joi.string().min(3).max(35).required(),
    file: generalFields.file.required().label('image file'),
})

export const getSingle = joi.object({
    categoryId: generalFields.id.optional(),
    slug: joi.string().optional(),
    select: joi.string().optional(),
    populate: joi.string().optional(),
    subselect: joi.string().optional(),
})

export const withID = joi.object({
    id: generalFields.id.required(),
})

export const update = joi.object({
    name: joi.string().min(3).max(35),
    file: generalFields.file.label('image file'),
    status: joi.string().valid('Active', 'Inactive'),
    id: generalFields.id.required(),
})
