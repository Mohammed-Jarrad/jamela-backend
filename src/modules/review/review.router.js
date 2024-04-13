import { Router } from 'express'
import { auth } from "../../middlewares/auth.js"
import * as reviewController from './review.controller.js'
import { endPoints } from "./review.endpoint.js"
const router = Router()

// get all reviews
router.get('/', auth(endPoints.getAll), reviewController.getAll)

// create new review
router.post('/', auth(endPoints.create), reviewController.create)

// update review
router.put('/:id', auth(endPoints.update), reviewController.update)

// delete review
router.delete('/:id', auth(endPoints.delete), reviewController.deleteReview)

export default router
