import { Router } from 'express'
import { auth } from '../../middlewares/auth.js'
import { validation, validationWithQuery } from '../../middlewares/validation.js'
import fileUpload, { fileValidation } from '../../utils/multer.js'
import { endpoint } from './product.endpoint.js'
import * as validator from './product.validation.js'
import * as productsController from './products.controller.js'

const router = Router()

// Create new product
router.post(
    '/',
    auth(endpoint.create),
    fileUpload(fileValidation.image).fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'subImages', maxCount: 4 },
    ]),
    validation(validator.create),
    productsController.createProduct
)
// Update product
router.put(
    '/:id',
    auth(endpoint.update),
    fileUpload(fileValidation.image).fields([
        { name: 'mainImage', maxCount: 1 },
        { name: 'newSubImages', maxCount: 4 },
    ]),
    validation(validator.update),
    productsController.updateProduct
)

router.get('/', auth(endpoint.getAll), productsController.getProducts)

router.get('/active', productsController.getActiveProducts)

router.get(
    '/category/:categoryId',
    validation(validator.getProductsWithCategory),
    productsController.getProductsWithCategory
)

router.delete('/:id', auth(endpoint.delete), validation(validator.deleteOne), productsController.deleteProduct)

router.get('/getSingle', validationWithQuery(validator.getSingle), productsController.getProduct)

export default router
