import joi from 'joi'
import { generalFields } from '../../middlewares/validation.js'

export const updateProfile = joi.object({
    username: joi.string().min(3).max(35),
    phone: joi.string(),
    address: joi.string(),
    gender: joi.string().valid('Male', 'Female'),
    file: generalFields.file.label('image'),
    newPassword: joi.string().min(6),
    oldPassword: joi.string().min(6),
})
export const addToWishlist = joi.object({
    id: generalFields.id.required(),
})
export const getAll = joi.object({
    search: joi.string(),
    select: joi.string(),
    sort: joi.string(),
    page: joi.number().positive().min(1),
    limit: joi.number().positive().min(1),
})
export const changeRole = joi.object({
    id: generalFields.id.required(),
    role: joi.string().valid('Admin', 'User'),
    status: joi.string().valid('Active', 'Inactive'),
})
export const withID = joi.object({
    id: generalFields.id.required(),
})
