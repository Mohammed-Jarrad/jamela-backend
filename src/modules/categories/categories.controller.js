import { request, response } from 'express'
import slugify from 'slugify'
import categoryModel from '../../../DB/model/category.model.js'
import {
    getFormatQuery,
    getPopulateQuery,
    getSearchQuery,
    getSelectQuery,
    getSortQuery,
} from '../../utils/apiFilter.js'
import cloudinary, { cloudinaryRemoveImage, cloudinaryUploadImage } from '../../utils/cloudinary.js'
import { asyncHandler } from '../../utils/error.js'
import { pagination } from '../../utils/pagination.js'

export const createCategory = asyncHandler(async (req = request, res = response, next) => {
    const name = req.body.name.toLowerCase()
    const userId = req.user._id
    if (await categoryModel.findOne({ name }).select('name'))
        return next(
            new Error(`Category name '${name}' already exist.`, {
                cause: 409,
            })
        )

    const { secure_url, public_id } = await cloudinary.uploader.upload(req.file.path, {
        folder: `${process.env.APP_NAME}/categories`,
    })
    const category = await categoryModel.create({
        name,
        slug: slugify(name),
        image: { secure_url, public_id },
        createdBy: userId,
        updatedBy: userId,
    })
    return res.status(201).json({ message: 'success', category })
})

export const getCategories = asyncHandler(async (req = request, res = response) => {
    const { limit, skip } = pagination(req.query)
    const formatObj = getFormatQuery(req.query)
    let searchObj = getSearchQuery(req.query.search, 'name')
    let sortString = getSortQuery(req.query.sort)
    let selectString = getSelectQuery(req.query.select)
    let populatePath = getPopulateQuery(req.query.populate, 'subcategories')
    let subselectString = getSelectQuery(req.query.subselect)

    let categories = await categoryModel
        .find({ ...formatObj, ...searchObj })
        .skip(skip)
        .limit(limit)
        .populate(populatePath && { path: populatePath, select: subselectString })
        .sort(sortString)
        .select(selectString)

    const totalResultsCounts = (await categoryModel.find(searchObj)).length
    const totalCount = await categoryModel.estimatedDocumentCount()
    return res.json({ message: 'success', totalCount, resultCount: categories.length, totalResultsCounts, categories })
})

export const getActiveCategories = asyncHandler(async (req = request, res = response) => {
    const { limit, skip } = pagination(req.query)
    const formatObj = getFormatQuery(req.query)
    let searchObj = getSearchQuery(req.query.search, 'name')
    let sortString = getSortQuery(req.query.sort)
    let selectString = getSelectQuery(req.query.select)
    let populatePath = getPopulateQuery(req.query.populate, 'subcategories')
    let subselectString = getSelectQuery(req.query.subselect)

    let categories = await categoryModel
        .find({ status: 'Active', ...formatObj, ...searchObj })
        .skip(skip)
        .limit(limit)
        .populate(populatePath && { path: populatePath, select: subselectString })
        .sort(sortString)
        .select(selectString)

    const totalResultsCounts = await categoryModel.find({ status: 'Active', ...formatObj, ...searchObj }).select('name')
    const totalCount = await categoryModel.find({ status: 'Active' }).countDocuments()
    return res.json({
        message: 'success',
        totalCount,
        resultCount: categories.length,
        totalResultsCounts: totalResultsCounts.length,
        categories,
    })
})

export const getCategory = asyncHandler(async (req = request, res = response, next) => {
    const { categoryId, slug } = req.query
    if (!categoryId && !slug) return next(new Error(`categoryId or slug is required.`, { cause: 400 }))
    const selectString = getSelectQuery(req.query.select)
    const populatePath = getPopulateQuery(req.query.populate, 'subcategories')
    const subselectString = getSelectQuery(req.query.subselect)
    const category = await categoryModel
        .findOne({
            ...(categoryId && { _id: categoryId }),
            ...(slug && { slug }),
        })
        .select(selectString)
        .populate(populatePath && { path: populatePath, select: subselectString })
    if (!category) return next(new Error(`Category not found.`, { cause: 404 }))
    return res.status(200).json({ message: 'success', category })
})

export const updateCategory = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const { name, status } = req.body
    const category = await categoryModel.findById(id)
    if (!category) return next(new Error(`category id ${id} not found.`, { cause: 404 }))
    // update category name & slug
    if (name) {
        if (await categoryModel.findOne({ name, _id: { $ne: id } }).select('name'))
            return next(
                new Error(`Category '${name}' is already exist.`, {
                    cause: 409,
                })
            )
        category.name = name
        category.slug = slugify(name)
    }
    // update category status
    if (status) category.status = status
    // update category image
    if (req.file) {
        const { secure_url, public_id } = await cloudinaryUploadImage(
            req.file.path,
            `${process.env.APP_NAME}/categories`
        )
        await cloudinaryRemoveImage(category.image.public_id)
        category.image = { secure_url, public_id }
    }
    category.updatedBy = req.user._id // update updatedBy field
    await category.save() // save the document
    return res.status(200).json({ message: 'success', category })
})

export const deleteCategory = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const category = await categoryModel.findById(id)
    if (!category) return next(new Error(`category with id '${id}' not found.`, { cause: 404 }))
    await category.deleteOne()
    return res.status(200).json({ message: 'success', categoryId: category._id })
})
