import { Router } from 'express'
import { auth } from '../../middlewares/auth.js'
import { validation, validationWithQuery } from '../../middlewares/validation.js'
import fileUpload, { fileValidation } from '../../utils/multer.js'
import subcategoryRoutes from '../subcategory/subcategory.router.js'
import * as categoriesController from './categories.controller.js'
import * as validator from './categories.validation.js'
import { endPoints } from './categroies.endpoint.js'

const router = Router()
// get all subcategories related to this category
router.use('/:id/subcategory', subcategoryRoutes)
// get all categories
router.get('/', auth(endPoints.getAll), categoriesController.getCategories)

// create category
router.post(
    '/',
    auth(endPoints.create),
    fileUpload(fileValidation.image).single('image'),
    validation(validator.create),
    categoriesController.createCategory
)
// get all active categories
router.get('/active', categoriesController.getActiveCategories)

// get single category with id or slug
router.get('/getSingle', validationWithQuery(validator.getSingle), categoriesController.getCategory)

// update category
router.put(
    '/:id',
    auth(endPoints.update),
    fileUpload(fileValidation.image).single('image'),
    validation(validator.update),
    categoriesController.updateCategory
)
// delete category
router.delete('/:id', auth(endPoints.delete), validation(validator.withID), categoriesController.deleteCategory)

export default router
