import joi from 'joi'
import { generalFields } from "../../middlewares/validation.js"

export const signup = joi.object({
    username: joi.string().min(3).max(35).required(),
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
    file: generalFields.file.label('image'),
    phone: joi.string(),
    address: joi.string(),
    gender: joi.string().valid('Male', 'Female'),
})

export const login = joi.object({
    email: joi.string().email().required(),
    password: joi.string().min(6).required(),
})