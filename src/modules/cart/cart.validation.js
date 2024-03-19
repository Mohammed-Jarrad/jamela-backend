import joi from 'joi'
import { generalFields } from '../../middlewares/validation.js'
export const createOrAdd = joi.object({
    productId: generalFields.id.required(),
    quantity: joi.number().integer().min(1), // default 1
    size: joi
        .string()
        .valid(
            'XS',
            'S',
            'M',
            'L',
            'XL',
            'XXL',
            'XXXL',
            "36",
            "37",
            "38",
            "39",
            "40",
            "41",
            "42",
            "43",
            "44",
            "45",
            "46",
            "47",
            "48",
            "49",
            "50"
        )
        .optional(),
    color: joi.string().optional(),
})
