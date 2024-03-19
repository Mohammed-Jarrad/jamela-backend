import express from 'express'
import { auth } from '../../middlewares/auth.js'
import { validation, validationWithQuery } from '../../middlewares/validation.js'
import fileUpload, { fileValidation } from '../../utils/multer.js'
import * as imageController from './image.controller.js'
import { endPoints } from './image.endpoint.js'
import * as validator from './image.validation.js'

const router = express.Router()

// create new image
router.post(
    '/',
    auth(endPoints.create),
    fileUpload(fileValidation.image).single('image'),
    validation(validator.create),
    imageController.createImage
)
// update
router.put(
    '/:id',
    auth(endPoints.update),
    fileUpload(fileValidation.image).single('image'),
    validation(validator.update),
    imageController.updateImage
)

// delete one
router.delete(
    '/:id',
    auth(endPoints.delete),
    validation(validator.withID),
    imageController.deleteImage
)
// get all
router.get('/', validationWithQuery(validator.getAll), imageController.getAll)
// get one
router.get(
    '/:id',
    auth(endPoints.getSingle),
    validation(validator.withID),
    imageController.getSingle
)

export default router
