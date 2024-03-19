import { Router } from 'express'
import fileUpload, { fileValidation } from '../../utils/multer.js'
import * as authController from './auth.controllers.js'
const router = Router()

router.post('/signup', fileUpload(fileValidation.image).single('image'), authController.signUp)
router.post('/signin', authController.signIn)
router.get('/confirmEmail/:token', authController.confirmEmail)
router.patch('/sendCode', authController.sendCode) 
router.patch('/checkCode/:token', authController.checkCode)
router.patch('/resetPassword/:token', authController.resetPassword)

export default router
