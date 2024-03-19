import { Router } from 'express'
import { auth, roles } from '../../middlewares/auth.js'
import { validation, validationWithQuery } from '../../middlewares/validation.js'
import fileUpload, { fileValidation } from '../../utils/multer.js'
import * as userController from './user.controller.js'
import { endPoints } from './user.endpoint.js'
import * as validator from './user.validation.js'

const router = Router()

// get user profile
router.get('/profile', auth(Object.values(roles)), userController.getProfile)
// update user profile
router.put(
    '/profile',
    auth(Object.values(roles)),
    fileUpload(fileValidation.image).single('image'),
    validation(validator.updateProfile),
    userController.updateProfile
)
// get all users
router.get('/', auth(endPoints.getAll), validationWithQuery(validator.getAll), userController.getAllUsers)

// Change user role & status
router.patch(
    '/:id',
    auth(endPoints.changeRoleAndStatus),
    validation(validator.changeRole),
    userController.changeUserRoleAndStatus
)

// Delete user
router.delete('/:id', auth(endPoints.delete), validation(validator.withID), userController.deleteUser)

// add product to wishlist
router.patch(
    '/wishlist/:id',
    auth(Object.values(roles)),
    validation(validator.addToWishlist),
    userController.addProductToWishlist
)

export default router
