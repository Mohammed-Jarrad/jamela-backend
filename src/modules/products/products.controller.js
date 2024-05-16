import { request, response } from 'express'
import slugify from 'slugify'
import Category from '../../../DB/model/category.model.js'
import Product from '../../../DB/model/product.model.js'
import Subcategory from '../../../DB/model/subcategroy.model.js'
import { getFormatQuery, getSearchQuery, getSelectQuery, getSortQuery } from '../../utils/apiFilter.js'
import { cloudinaryRemoveImage, cloudinaryUploadImage } from '../../utils/cloudinary.js'
import { asyncHandler } from '../../utils/error.js'
import { pagination } from '../../utils/pagination.js'

/** ----------------------------------------------------------------
 * @desc create new product
 * @route /products
 * @method POST
 * @access only admin
   -----------------------------------------------------------------
 */
export const createProduct = asyncHandler(async (req = request, res = response, next) => {
    const { name, price, discount = 0, categoryId, subcategoryId } = req.body
    // check if category and subcategory founded and check if the subcategory is in the category
    const checkCategory = await Category.findById(categoryId)
    if (!checkCategory) return next(new Error(`Category not found.`, { cause: 404 }))
    if (await Product.findOne({ name })) {
        return next(new Error(`This product already exists.`, { cause: 409 }))
    }
    // check if subcategory is in the category
    if (subcategoryId) {
        const sub = await Subcategory.findById(subcategoryId)
        if (!sub) return next(new Error(`Subcategory not found.`, { cause: 404 }))
        if (sub.categoryId.toString() !== categoryId) {
            return next(new Error(`Subcategory not found in this category.`, { cause: 404 }))
        }
    }
    // generate slug and final price
    req.body.slug = slugify(name)
    req.body.finalPrice = (price - price * (discount / 100)).toFixed(2)
    // upload main image to cloudinary
    req.body.mainImage = await cloudinaryUploadImage(
        req.files.mainImage[0].path,
        `${process.env.APP_NAME}/products/${name}/mainImages`
    )
    // upload sub images to cloudinary
    if (req.files.subImages && req.files.subImages.length > 0) {
        req.body.subImages = await Promise.all(
            req.files.subImages.map(async (subImage) => {
                return await cloudinaryUploadImage(subImage.path, `${process.env.APP_NAME}/products/${name}/subImages`)
            })
        )
    }
    // set createdBy and updatedBy
    req.body.createdBy = req.user._id
    req.body.updatedBy = req.user._id
    // create product
    const product = await Product.create(req.body)
    // got the created product and return it
    return res.status(201).json({ message: 'success', product })
})
/** ----------------------------------------------------------------
 * @desc update product
 * @route /products/:id
 * @method PUT
 * @access only admin
   -----------------------------------------------------------------
 */
export const updateProduct = asyncHandler(async (req = request, res = response, next) => {
    const { id: productId } = req.params
    const {
        categoryId,
        name,
        description,
        price,
        discount,
        status,
        stock,
        sizes,
        colors,
        removedPublicIds,
        isNewArrival,
    } = req.body
    const { mainImage, newSubImages } = req.files
    const product = await Product.findById(productId)
    if (!product) return next(new Error(`Product not found.`, { cause: 404 }))

    // check if category founded and check if the subcategory founded and check if the subcategory is in the category
    if (categoryId) {
        const checkCategory = await Category.findById(categoryId)
        if (!checkCategory) return next(new Error(`Category not found.`, { cause: 404 }))
        product.categoryId = categoryId
    }

    // update subcatery or remove it from the product
    if ('subcategoryId' in req.body) {
        if (!req.body.subcategoryId) product.subcategoryId = null
        else {
            const sub = await Subcategory.findById(req.body.subcategoryId)
            if (!sub) return next(new Error(`Subcategory not found.`, { cause: 404 }))
            if (sub.categoryId.toString() !== product.categoryId.toString()) {
                return next(new Error(`Subcategory not found in this category.`, { cause: 404 }))
            }
            product.subcategoryId = req.body.subcategoryId
        }
    }
    // Update name
    if (name) {
        if (await Product.findOne({ name, _id: { $ne: productId } }))
            return next(new Error(`Product ${name} is already exists.`, { cause: 409 }))
        product.name = name
        product.slug = slugify(name)
    }
    // Update description
    if (description) product.description = description
    // Update price
    if (price) {
        product.price = price
        product.finalPrice = (price - price * (product.discount / 100)).toFixed(2)
    }
    // Update discount
    if (discount) {
        product.discount = discount
        if (price) {
            product.finalPrice = (price - price * (discount / 100)).toFixed(2)
        } else {
            product.finalPrice = (product.price - product.price * (discount / 100)).toFixed(2)
        }
    }
    // Update isNewArrival
    if (isNewArrival && isNewArrival === 'true') product.isNewArrival = true
    else if (isNewArrival && isNewArrival === 'false') product.isNewArrival = false
    // Update status
    if (status) product.status = status
    // Update sizes
    if (sizes) product.sizes = sizes
    // Update colors
    if (colors) product.colors = colors
    // Update stock
    if (stock) product.stock = stock
    // Update main image
    if (mainImage) {
        // delete old main image
        await cloudinaryRemoveImage(product.mainImage.public_id)
        // upload new main image to cloudinary and update it
        product.mainImage = await cloudinaryUploadImage(
            mainImage[0].path,
            `${process.env.APP_NAME}/products/${product.name}/mainImages`
        )
    }
    // Update sub images
    if (newSubImages && newSubImages.length > 0) {
        for (const subImage of newSubImages) {
            const { public_id, secure_url } = await cloudinaryUploadImage(
                subImage.path,
                `${process.env.APP_NAME}/products/${product.name}/subImages`
            )
            product.subImages.push({ public_id, secure_url }) // add new sub image to sub images array
        }
    }
    // delete all sub images that have the same public ids
    if (removedPublicIds && removedPublicIds.length > 0) {
        for (const publicId of removedPublicIds) {
            await cloudinaryRemoveImage(publicId) // delete sub image from cloudinary
            product.subImages = product.subImages.filter((subImage) => subImage.public_id !== publicId) // remove sub image from sub images array
        }
    }
    // Update person who updated
    product.updatedBy = req.user._id
    // got the updated product and return it
    const updatedProduct = await product.save()
    return res.status(200).json({ message: 'success', product: updatedProduct })
})
/** ----------------------------------------------------------------
 * @desc get products with category
 * @route /products/category/:categoryId
 * @method GET
 * @access ALL
   ----------------------------------------------------------------- */
export const getProductsWithCategory = asyncHandler(async (req = request, res = response, next) => {
    const { categoryId } = req.params
    const category = await Category.findById(categoryId)
    if (!category) return next(new Error(`Category not found.`, { cause: 404 }))
    const products = await Product.find({ categoryId })
    return res.status(200).json({ message: 'success', products })
})

/** ----------------------------------------------------------------
 * @desc get product
 * @route /products/getSingle
 * @method GET
 * @access ALL
   -----------------------------------------------------------------
 */
export const getProduct = asyncHandler(async (req = request, res = response, next) => {
    if (!req.query.productId && !req.query.slug)
        return next(new Error(`Product id or slug is required.`, { cause: 404 }))
    const product = await Product.findOne({
        ...(req.query.productId && { _id: req.query.productId }),
        ...(req.query.slug && { slug: req.query.slug }),
    }).populate([
        { path: 'createdBy', select: 'username' },
        { path: 'updatedBy', select: 'username' },
        { path: 'categoryId', select: 'name' },
        { path: 'subcategoryId', select: 'name' },
    ])
    if (!product) return next(new Error(`Product not found.`, { cause: 404 }))
    return res.status(200).json({ message: 'success', product })
})
/** ----------------------------------------------------------------
 * @desc get active products
 * @route /products/active
 * @method GET
 * @access ALL
   -----------------------------------------------------------------
 */
export const getActiveProducts = asyncHandler(async (req = request, res = response, next) => {
    const { limit, skip } = pagination(req.query)
    const foramatObj = getFormatQuery(req.query)
    const searchObj = getSearchQuery(req.query?.search, 'name', 'description')
    const sortString = getSortQuery(req.query?.sort)
    const selectString = getSelectQuery(req.query?.select)
    const products = await Product.find({
        status: 'Active',
        ...foramatObj,
        ...searchObj,
        ...(req.query?.categoryId && { categoryId: req.query?.categoryId }),
        ...(req.query?.subcategoryId && { subcategoryId: req.query?.subcategoryId }),
    })
        .limit(limit)
        .skip(skip)
        .sort(sortString)
        .select(selectString)
        .populate([
            {
                path: 'categoryId',
                select: 'name',
                populate: { path: 'subcategories', select: 'name' },
            },
            { path: 'subcategoryId', select: 'name ' },
        ])
    const totalCount = await Product.find({ status: 'Active' }).countDocuments()
    const totalResultsCounts = await Product.find({
        status: 'Active',
        ...foramatObj,
        ...searchObj,
        ...(req.query?.categoryId && { categoryId: req.query?.categoryId }),
        ...(req.query?.subcategoryId && { subcategoryId: req.query?.subcategoryId }),
    }).select('name')
    return res.status(200).json({
        message: 'success',
        products,
        totalCount,
        totalResultsCounts: totalResultsCounts.length,
        resultCount: products.length,
    })
})

/** ----------------------------------------------------------------
 * @desc get all products
 * @route /products
 * @method GET
 * @access only admin
   -----------------------------------------------------------------
 */
export const getProducts = asyncHandler(async (req = request, res = response, next) => {
    const { limit, skip } = pagination(req.query)
    const foramatObj = getFormatQuery(req.query)
    const searchObj = getSearchQuery(req.query?.search, 'name', 'description')
    const sortString = getSortQuery(req.query?.sort)
    const selectString = getSelectQuery(req.query?.select)

    const products = await Product.find({ ...foramatObj, ...searchObj })
        .limit(limit)
        .skip(skip)
        .sort(sortString)
        .select(selectString)
        .populate([
            {
                path: 'categoryId',
                select: 'name',
                populate: { path: 'subcategories', select: 'name' },
            },
            { path: 'subcategoryId', select: 'name ' },
        ])
    const totalCount = await Product.estimatedDocumentCount()
    const totalResultsCounts = (await Product.find({ ...foramatObj, ...searchObj })).length
    return res.status(200).json({
        message: 'success',
        totalCount,
        resultCount: products.length,
        totalResultsCounts,
        products,
    })
})

/** ----------------------------------------------------------------
 * @desc delete product
 * @route /products/:id
 * @method DELETE
 * @access only admin
   -----------------------------------------------------------------
 */
export const deleteProduct = asyncHandler(async (req = request, res = response, next) => {
    const { id } = req.params
    const product = await Product.findById(id)
    if (!product) return next(new Error(`product with id '${id}' not found.`, { cause: 404 }))
    await product.deleteOne()
    return res.status(200).json({ message: 'success', productId: product._id })
})
