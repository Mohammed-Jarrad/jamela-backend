import joi from 'joi'
import { generalFields } from '../../middlewares/validation.js'

export const create = joi.object({
    name: joi.string().min(3).max(35).required(),
    categoryId: generalFields.id.required(),
    file: generalFields.file.required().label('image'),
})

export const withId = joi.object({
    id: generalFields.id.required(),
})

export const getSingle = joi.object({
    subcategoryId: generalFields.id.optional(),
    slug: joi.string().optional(),
    select: joi.string().optional(),
    populate: joi.string().optional(),
    subselect: joi.string().optional(),
})

export const update = joi.object({
    name: joi.string().min(3).max(35),
    categoryId: generalFields.id,
    file: generalFields.file.label('image'),
    status: joi.string().valid('Active', 'Inactive'),
    id: generalFields.id.required(),
})
