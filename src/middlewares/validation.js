import { request, response } from 'express'
import joi from 'joi'
import { Types } from 'mongoose'

export const validation = (schema) => {
    return (req = request, res = response, next) => {
        const inputsData = {
            ...req.body,
            ...req.params,
            ...((req.file || req.files) && {
                file: req.file || req.files,
            }),
        }
        const result = schema.validate(inputsData, { abortEarly: false })
        if (result?.error) {
            const messages = [...result.error.details].map((item) => item.message)
            return res.status(400).json({ message: 'Validation Error', messages })
        }
        next()
    }
}
export const validationWithQuery = (schema) => {
    return (req = request, res = response, next) => {
        const inputsData = {
            ...req.body,
            ...req.params,
            ...req.query,
            ...((req.file || req.files) && {
                file: req.file || req.files,
            }),
        }
        const result = schema.validate(inputsData, { abortEarly: false })
        if (result?.error) {
            const messages = [...result.error.details].map((item) => item.message)
            return res.status(400).json({ message: 'Validation Error', messages })
        }
        next()
    }
}

export const generalFields = {
    id: joi.string().custom((value, helpers) => {
        const isValid = Types.ObjectId.isValid(value)
        if (!isValid) return helpers.error('any.invalid')
        return value
    }, 'Custom Validation for MongoDB ObjectId'),
    email: joi.string().email().min(5).messages({
        'string.empty': 'Email is required',
        'string.email': 'Invalid email',
    }),
    password: joi.string().min(3).messages({
        'string.empty': 'Password is required',
    }),
    file: joi.object({
        size: joi.number().positive().required(),
        path: joi.string().required(),
        filename: joi.string().required(),
        destination: joi.string().required(),
        mimetype: joi.string().required(),
        encoding: joi.string().required(),
        originalname: joi.string().required(),
        fieldname: joi.string().required(),
    }),
    sizes: joi
        .array()
        .items(
            joi
                .string()
                .valid(
                    'XS',
                    'S',
                    'M',
                    'L',
                    'XL',
                    'XXL',
                    'XXXL',
                    '36',
                    '37',
                    '38',
                    '39',
                    '40',
                    '41',
                    '42',
                    '43',
                    '44',
                    '45',
                    '46',
                    '47',
                    '48',
                    '49',
                    '50'
                )
        )
        .label('Sizes'),
}
