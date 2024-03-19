import { Router } from 'express'
import { auth, roles } from '../../middlewares/auth.js'
import { validation } from '../../middlewares/validation.js'
import * as orderController from './order.controller.js'
import { endPoints } from './order.endpoint.js'
import * as validator from './order.validation.js'

const router = Router()

// create new order
router.post('/', auth(endPoints.create), validation(validator.create), orderController.createOrder)

// get all orders
router.get('/', auth(endPoints.getAll), orderController.getAllOrders)

// get orders for user
router.get('/user', auth(endPoints.getOrdersForUser), orderController.getOrdersForUser)

// cancel order
router.patch('/cancel/:id', auth(endPoints.cancel), validation(validator.cancel), orderController.cancelOrder)

// change order status
router.patch('/changeStatus/:id', auth(endPoints.changeStatus), validation(validator.changeStatus), orderController.changeStatus)

// get order
router.get('/:id', auth(Object.values(roles)), validation(validator.get), orderController.getOrder)



export default router
