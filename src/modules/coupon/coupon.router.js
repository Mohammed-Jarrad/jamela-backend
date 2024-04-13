import { Router } from 'express'
import { auth } from '../../middlewares/auth.js'
import { validation } from '../../middlewares/validation.js'
import * as couponController from './coupon.controller.js'
import { endPoints } from './coupon.endpoint.js'
import * as validator from './coupon.validation.js'

const router = Router()

// create new coupon
router.post('/', auth(endPoints.create), validation(validator.create), couponController.createCoupon)
// get all coupons
router.get('/', auth(endPoints.getAll), couponController.getCoupons)
// get single coupon
router.get('/:id', auth(endPoints.getSingle), validation(validator.getSingle), couponController.getCoupon)
// update coupon
router.route('/:id').put(auth(endPoints.update), validation(validator.update), couponController.updateCoupon)
// Soft delete
router.patch('/softDelete/:id', auth(endPoints.softDelete), couponController.softDelete)
// retore
router.patch('/restore/:id', auth(endPoints.restore), couponController.restoreCoupon)
// hard delete
router.delete('/hardDelete/:id', auth(endPoints.hardDelete), couponController.hardDelete)
// check coupon
router.post('/checkCoupon', auth(endPoints.checkCoupon), validation(validator.checkCoupon), couponController.checkCoupon)

// clear coupon
router.patch('/clearCoupon/:id', auth(endPoints.clearCoupon), couponController.clearCoupon)

export default router
