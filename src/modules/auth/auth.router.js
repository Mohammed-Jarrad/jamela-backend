import { Router } from 'express'
import fileUpload, { fileValidation } from '../../utils/multer.js'
import * as authController from './auth.controllers.js'
import * as validator from './auth.validation.js'
import { validation } from '../../middlewares/validation.js'

const router = Router()

router.post('/signup', fileUpload(fileValidation.image).single('image'), validation(validator.signup), authController.signUp)
router.post('/signin', validation(validator.login), authController.signIn)
router.get('/confirmEmail/:token', authController.confirmEmail)
router.patch('/sendCode', authController.sendCode) 
router.patch('/checkCode/:token', authController.checkCode)
router.patch('/resetPassword/:token', authController.resetPassword)

export default router
