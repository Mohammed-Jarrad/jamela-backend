import { Router } from 'express'
import { auth } from '../../middlewares/auth.js'
import { validation, validationWithQuery } from '../../middlewares/validation.js'
import fileUpload, { fileValidation } from '../../utils/multer.js'
import * as subcategoryController from './subcategory.controller.js'
import { endPoints } from './subcategory.endpoint.js'
import * as validator from './subcategory.validation.js'
const router = Router({ mergeParams: true })

// /subcategory (POST) (Create Subcategory)
router.post(
    '/',
    auth(endPoints.create),
    fileUpload(fileValidation.image).single('image'),
    validation(validator.create),
    subcategoryController.createSubCategory
)

// /subcategory/all (GET) (Get All Subcategories)
router.get('/all', auth(endPoints.getAll), subcategoryController.getAllSubcategories)

// /categories/:id/subcategory (GET)
router.get('/', validation(validator.withId), subcategoryController.getSubcategoriesWithCategory)

// /subcategory/:id (PUT) (Update Subcategory)
router.put(
    '/:id',
    auth(endPoints.update),
    fileUpload(fileValidation.image).single('image'),
    validation(validator.update),
    subcategoryController.updateSubcategory
)

// /subcategory/getSingle (GET) (Get Subcategory)
router.get('/getSingle', validationWithQuery(validator.getSingle), subcategoryController.getSubcategory)

// /subcategory/:id (DELETE) (Delete Subcategory)
router.delete('/:id', auth(endPoints.delete), validation(validator.withID), subcategoryController.deleteSubcategory)

export default router
