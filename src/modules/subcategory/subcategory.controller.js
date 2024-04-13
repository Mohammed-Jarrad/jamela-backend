import { request, response } from 'express'
import slugify from 'slugify'
import Category from '../../../DB/model/category.model.js'
import Subcategory from '../../../DB/model/subcategroy.model.js'
import { getPopulateQuery, getSearchQuery, getSelectQuery, getSortQuery } from '../../utils/apiFilter.js'
import { cloudinaryRemoveImage, cloudinaryUploadImage } from '../../utils/cloudinary.js'
import { asyncHandler } from '../../utils/error.js'
import { pagination } from '../../utils/pagination.js'

// /subcategory (POST)
export const createSubCategory = asyncHandler(async (req = request, res = response) => {
    const { name, categoryId } = req.body
    const subcategory = await Subcategory.findOne({ name })
    if (subcategory) return next(new Error(`subcategory [${name}] is already exists.`, { cause: 409 }))
    const category = await Category.findById(categoryId)
    if (!category) return next(new Error(`category with id ${categoryId} not found.`, { cause: 404 }))
    // upload the image to cloudinary
    const { secure_url, public_id } = await cloudinaryUploadImage(
        req.file.path,
        `${process.env.APP_NAME}/subcategories`
    )
    // create the new subcategory
    const newSubCategory = await Subcategory.create({
        name,
        categoryId,
        image: { secure_url, public_id },
        slug: slugify(name),
        createdBy: req.user._id,
        updatedBy: req.user._id,
    })
    return res.status(201).json({ message: 'success', subcategory: newSubCategory })
})

// get subcategories for a custom category [/categories/:id/subcategories]
export const getSubcategoriesWithCategory = asyncHandler(async (req = request, res = response) => {
    const { id: categoryId } = req.params
    const category = await Category.findById(categoryId)
    if (!category) {
        return next(new Error(`category with id '${categoryId}' not found.`, { cause: 404 }))
    }
    const subcategories = await Subcategory.find({ categoryId, status: 'Active' }).populate('categoryId')
    return res.status(200).json({ message: 'success', subcategories })
})

// /subcategory/getSingle (GET)
export const getSubcategory = asyncHandler(async (req = request, res = response, next) => {
    const { subcategoryId, slug } = req.query
    if (!subcategoryId && !slug) return next(new Error(`subcategoryId or slug is required.`, { cause: 400 }))
    const selectString = getSelectQuery(req.query.select)
    const populatePath = getPopulateQuery(req.query.populate, 'products')
    const subselectString = getSelectQuery(req.query.subselect)
    let populateArr = [{ path: 'categoryId', select: 'name' }]
    populatePath && populateArr.push({ path: populatePath, select: subselectString })

    const subcategory = await Subcategory
        .findOne({
            ...(subcategoryId && { _id: subcategoryId }),
            ...(slug && { slug }),
        })
        .populate(populateArr)
        .select(selectString)
    if (!subcategory) return next(new Error(`subcategory with id ${id} not found.`, { cause: 404 }))
    return res.status(200).json({ message: 'success', subcategory })
})

// /subcategory/:id (PUT)
export const updateSubcategory = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const { name, categoryId, status } = req.body
    const image = req.file
    const subcategory = await Subcategory.findById(id)
    if (!subcategory) return next(new Error(`subcategory with id ${id} not found.`, { cause: 404 }))
    if (name) {
        if (await Subcategory.findOne({ name, _id: { $ne: id } }).select('name'))
            return next(new Error(`subcategory ${name} is already exists.`, { cause: 409 }))
        subcategory.name = name
        subcategory.slug = slugify(name)
    }
    if (status) subcategory.status = status
    if (image) {
        const { secure_url, public_id } = await cloudinaryUploadImage(
            req.file.path,
            `${process.env.APP_NAME}/subcategories`
        )
        await cloudinaryRemoveImage(subcategory.image.public_id)
        subcategory.image = { secure_url, public_id }
    }
    if (categoryId) {
        const category = await Category.findById(categoryId)
        if (!category) return next(new Error(`category with id ${categoryId} not found.`, { cause: 404 }))
        subcategory.categoryId = categoryId
    }
    subcategory.updatedBy = req.user._id
    await subcategory.save()
    return res.status(200).json({ message: 'success', subcategory })
})

// /subcategory/:id (DELETE)
export const deleteSubcategory = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const subcategory = await Subcategory.findById(id)
    if (!subcategory) return next(new Error(`subcategory with id ${id} not found.`, { cause: 404 }))
    await subcategory.deleteOne()
    return res.status(200).json({ message: 'success', subcategoryId: subcategory._id })
})

// /subcategory/all (GET)
export const getAllSubcategories = asyncHandler(async (req = request, res = response) => {
    const { limit, skip } = pagination(req.query)
    let searchObj = getSearchQuery(req.query.search, 'name')
    let sortString = getSortQuery(req.query.sort)
    let selectString = getSelectQuery(req.query.select)
    let populatePath = getPopulateQuery(req.query.populate, 'categoryId')
    let subselectString = getSelectQuery(req.query.subselect)
    const subcategories = await Subcategory
        .find({ ...searchObj, ...(req.query.categoryId && { categoryId: req.query.categoryId }) })
        .skip(skip)
        .limit(limit)
        .populate(populatePath && { path: populatePath, select: subselectString })
        .sort(sortString)
        .select(selectString)
        
    const totalResultsCounts = await Subcategory.find({
        ...searchObj,
        ...(req.query.categoryId && { categoryId: req.query.categoryId }),
    })
    const totalCount = await Subcategory.countDocuments()
    return res.json({
        message: 'success',
        totalCount,
        resultCount: subcategories.length,
        totalResultsCounts: totalResultsCounts.length,
        subcategories,
    })
})

// /subcategory/active (GET)
export const getActiveSubcategories = asyncHandler(async (req = request, res = response) => {
    const { limit, skip } = pagination(req.query)
    let searchObj = getSearchQuery(req.query.search, 'name')
    let sortString = getSortQuery(req.query.sort)
    let selectString = getSelectQuery(req.query.select)
    let populatePath = getPopulateQuery(req.query.populate, 'categoryId')
    let subselectString = getSelectQuery(req.query.subselect)
    const subcategories = await Subcategory
        .find({ ...searchObj, status: 'Active', ...(req.query.categoryId && { categoryId: req.query.categoryId }) })
        .skip(skip)
        .limit(limit)
        .populate(populatePath && { path: populatePath, select: subselectString })
        .sort(sortString)
        .select(selectString)
    const totalResultsCounts = (
        await Subcategory.find({
            ...searchObj,
            status: 'Active',
            ...(req.query.categoryId && { categoryId: req.query.categoryId }),
        })
    ).length
    const totalCount = await Subcategory.countDocuments()
    return res.json({
        message: 'success',
        totalCount,
        resultCount: subcategories.length,
        totalResultsCounts,
        subcategories,
    })
})
