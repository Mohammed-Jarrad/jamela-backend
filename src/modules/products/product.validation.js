import joi from 'joi'
import { generalFields } from '../../middlewares/validation.js'

export const update = joi.object({
    name: joi.string().min(3).max(35),
    description: joi.string().min(2),
    stock: joi.number().integer().min(0),
    isNewArrival: joi.boolean().valid(true, false),
    price: joi.number().positive(),
    discount: joi.number().positive().min(1).allow(0),
    status: joi.string().valid('Active', 'Inactive'),
    sizes: generalFields.sizes.optional(),
    colors: joi.array().items(joi.string()),
    categoryId: generalFields.id,
    subcategoryId: generalFields.id.allow(''),
    removedPublicIds: joi.array().items(joi.string()),
    id: generalFields.id.required(),
    file: joi.object({
        mainImage: joi.array().items(generalFields.file.required()).length(1).label('Primary image'),
        newSubImages: joi.array().items(generalFields.file.required()).max(4).min(1).label('Secondary images'),
    }),
})

export const create = joi.object({
    name: joi.string().min(3).max(35).required(),
    description: joi.string().min(2).required(),
    stock: joi.number().integer().min(0).required(),
    price: joi.number().positive().required(),
    discount: joi.number().positive().min(1).allow(0),
    file: joi
        .object({
            mainImage: joi.array().items(generalFields.file.required()).length(1).required().label('Primary image'),
            subImages: joi
                .array()
                .items(generalFields.file.required())
                .max(4)
                .min(1)
                .required()
                .label('Secondary images'),
        })
        .required(),
    sizes: generalFields.sizes.optional(),
    colors: joi.array().items(joi.string()).label('Colors'),
    categoryId: generalFields.id.required().label('Category'),
    subcategoryId: generalFields.id.optional().label('Subcategory'),
})

export const deleteOne = joi.object({
    id: generalFields.id.required().label('Product id'),
})

export const getSingle = joi.object({
    productId: generalFields.id.optional(),
    slug: joi.string().optional(),
})

export const getProductsWithCategory = joi.object({
    categoryId: generalFields.id.required(),
})
