import { Router } from 'express'
import { auth } from '../../middlewares/auth.js'
import { validation } from '../../middlewares/validation.js'
import * as cartController from './cart.controller.js'
import { endpoints } from './cart.endpoint.js'
import * as validator from './cart.validation.js'

const router = Router()

router.post('/', auth(endpoints.create), validation(validator.createOrAdd), cartController.createCartorAddToCart)

router.patch('/removeItem', auth(endpoints.removeItem), cartController.removeItem)

router.patch('/updateQuantity', auth(endpoints.updateQuantity), cartController.updateQuantity)

router.patch('/updateSizeOrColor', auth(endpoints.updateSizeOrColor), cartController.updateSizeOrColor)

router.patch('/clearCart', auth(endpoints.clearCart), cartController.clearCart)

router.get('/', auth(endpoints.get), cartController.get)

router.get('/getAll', auth(endpoints.getAll), cartController.getAll)

export default router
