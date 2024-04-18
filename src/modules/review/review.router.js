import { Router } from 'express'
import { auth } from '../../middlewares/auth.js'
import * as reviewController from './review.controller.js'
import { endPoints } from './review.endpoint.js'
import { validationWithQuery, validation } from '../../middlewares/validation.js'
import * as validator from './review.validation.js'

const router = Router()

// get all reviews
router.get('/', validationWithQuery(validator.getAll), reviewController.getAll)

// create new review
router.post('/', auth(endPoints.create), validation(validator.create), reviewController.create)

// update review
router.put('/:id', auth(endPoints.update), validation(validator.update), reviewController.update)

// delete review
router.delete('/:id', auth(endPoints.delete), validation(validator.deleteOne), reviewController.deleteReview)

export default router
