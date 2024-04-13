import { Router } from 'express'
import { auth, roles } from '../../middlewares/auth.js'
import { validation, validationWithQuery } from '../../middlewares/validation.js'
import * as orderController from './order.controller.js'
import { endPoints } from './order.endpoint.js'
import * as validator from './order.validation.js'

const router = Router()

// create new order
router.post('/', auth(endPoints.create), validation(validator.create), orderController.createOrder)

// get all orders
router.get('/', auth(endPoints.getAll), orderController.getAllOrders)

// get orders for user
router.get(
    '/user',
    auth(endPoints.getOrdersForUser),
    validationWithQuery(validator.getOrdersForUser),
    orderController.getOrdersForUser
)

// cancel order
router.patch('/cancel/:id', auth(endPoints.cancel), validation(validator.cancel), orderController.cancelOrder)

// change order status
router.patch(
    '/change-status/:id',
    auth(endPoints.changeStatus),
    validation(validator.changeStatus),
    orderController.changeStatus
)

// change order coupon
router.patch(
    '/change-coupon/:id',
    auth(endPoints.changeCoupon),
    validation(validator.changeCoupon),
    orderController.changeOrderCoupon
)

// remove order coupon
router.patch(
    '/remove-coupon/:id',
    auth(endPoints.removeCoupon),
    validation(validator.removeCoupon),
    orderController.removeOrderCoupon
)

// edit order note
router.patch(
    '/edit-note/:id',
    auth(endPoints.editNote),
    validation(validator.editNote),
    orderController.updateOrderNote
)

// get order
router.get('/:id', auth(Object.values(roles)), validation(validator.get), orderController.getOrder)

// delete order
router.delete('/:id', auth(endPoints.delete), validation(validator.get), orderController.deleteOrder)

// accept all pending orders
router.patch('/accept-all', auth(endPoints.acceptAll), orderController.acceptAllOrders)

export default router
