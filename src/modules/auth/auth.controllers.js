import bcrypt from 'bcryptjs'
import clipboardy from 'clipboardy'
import { request, response } from 'express'
import fs from 'fs'
import Handlebars from 'handlebars'
import jwt from 'jsonwebtoken'
import { customAlphabet } from 'nanoid'
import path from 'path'
import { fileURLToPath } from 'url'
import userModel from '../../../DB/model/user.model.js'
import { cloudinaryUploadImage } from '../../utils/cloudinary.js'
import { sendEmail } from '../../utils/email.js'
import { asyncHandler } from '../../utils/error.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// SIGN Up
export const signUp = asyncHandler(async (req = request, res = response, next) => {
    let { email, password } = req.body
    const user = await userModel.findOne({ email })
    if (user) {
        return next(new Error(`this email '${email}' is already exists.`, { cause: 409 }))
    }
    password = await bcrypt.hash(password, parseInt(process.env.SALT_ROUND))
    let secure_url = null,
        public_id = null
    if (req.file) {
        const result = await cloudinaryUploadImage(req.file.path, `${process.env.APP_NAME}/users`)
        secure_url = result.secure_url
        public_id = result.public_id
    }
    const confirmEmailToken = jwt.sign({ email }, process.env.CONFIRM_EMAIL_SECRET)
    const link = `${req.protocol}://${req.headers.host}/auth/confirmEmail/${confirmEmailToken}`
    const __path = path.join(__dirname, '../../verification_link.html')
    const source = fs.readFileSync(__path, { encoding: 'utf-8' }).toString()
    const template = Handlebars.compile(source)
    const html = template({ link })
    await sendEmail(email, 'Confirm Email', html)
    await userModel.create({
        ...req.body,
        email,
        password,
        ...(secure_url && public_id && { image: { secure_url, public_id } }),
    })
    return res.status(201).json({ message: 'success' })
})
// LOGIN
export const signIn = asyncHandler(async (req = request, res = response, next) => {
    const { email, password } = req.body
    const user = await userModel.findOne({ email })
    if (!user) {
        return next(new Error(`invalid email.`, { cause: 400 }))
    }
    const match = await bcrypt.compare(password, user.password)
    if (!match) {
        return next(new Error(`invalid password.`, { cause: 400 }))
    }
    if (user.confirmEmail == false) {
        const confirmEmailToken = jwt.sign({ email }, process.env.CONFIRM_EMAIL_SECRET)
        const link = `${req.protocol}://${req.headers.host}/auth/confirmEmail/${confirmEmailToken}`
        const __path = path.join(__dirname, '../../verification_link.html')
        const source = fs.readFileSync(__path, { encoding: 'utf-8' }).toString()
        const template = Handlebars.compile(source)
        const html = template({ link })
        await sendEmail(email, 'Confirm Email', html)
        return next(
            new Error(
                `Please confirm your email first, we sent a verification link to your email.`,
                {
                    cause: 400,
                }
            )
        )
    }
    if (user.status == 'Inactive')
        return next(new Error(`Your account is inactive.`, { cause: 400 }))

    const token = jwt.sign(
        { id: user._id, role: user.role, status: user.status },
        process.env.LOGIN_SECRET,
        {
            // expiresIn: '5m',
        }
    )
    const currentUser = await userModel
        .findById(user._id)
        .select('-password -changePasswordTime -code -confirmEmail')
        .populate('wishList')
        .populate('cart')
    res.status(200).json({ message: 'success', token, user: currentUser })
})
// CONFIRM EMAIL => /auth/confirmEmail/:token
export const confirmEmail = asyncHandler(async (req = request, res = response, next) => {
    const { token } = req.params
    if (!token) {
        return res.redirect(`${process.env.FRONTEND_LOGIN_PAGE}?message=email-not-confirmed`)
    }
    const decoded = jwt.verify(token, process.env.CONFIRM_EMAIL_SECRET)
    if (!decoded) {
        return res.redirect(`${process.env.FRONTEND_LOGIN_PAGE}?message=email-not-confirmed`)
    }
    const user = await userModel.findOneAndUpdate(
        { email: decoded.email, confirmEmail: false },
        { confirmEmail: true }
    )
    if (!user) {
        return res.redirect(`${process.env.FRONTEND_LOGIN_PAGE}?message=email-not-confirmed`)
    }
    return res.redirect(`${process.env.FRONTEND_LOGIN_PAGE}?message=email-confirmed`)
})
// SEND CODE
export const sendCode = asyncHandler(async (req = request, res = response, next) => {
    const { email } = req.body
    const code = customAlphabet('1234567890', 4)()
    const user = await userModel.findOneAndUpdate({ email }, { code }, { new: true })
    if (!user) {
        return next(new Error(`User not found.`, { cause: 400 }))
    }
    const checkCodeToken = jwt.sign({ email }, process.env.CHECK_CODE_SECRET, { expiresIn: '10m' })
    const __path = path.join(__dirname, '../../send_code.html')
    const source = fs.readFileSync(__path, { encoding: 'utf-8' }).toString()
    const template = Handlebars.compile(source)
    const html = template({
        code,
        copyToClipboard: async () => await clipboardy.write(code),
    })
    await sendEmail(email, 'Verification Code', html)
    return res.status(200).json({ message: 'success', token: checkCodeToken })
})
// CHECK CODE /auth/checkCode/:token (PATCH)
export const checkCode = asyncHandler(async (req = request, res = response, next) => {
    const { token } = req.params
    const { code } = req.body
    if (!token) return next(new Error(`Invalid operation.`, { cause: 400 }))
    const decoded = jwt.verify(token, process.env.CHECK_CODE_SECRET)
    if (!decoded) return next(new Error(`Invalid operation.`, { cause: 400 }))
    const user = await userModel.findOneAndUpdate(
        { email: decoded.email, code },
        { code: null },
        { new: true }
    )
    if (!user) return next(new Error(`Invalid operation, try again.`, { cause: 400 }))
    const resetPasswordToken = jwt.sign({ email: user.email }, process.env.RESET_PASSWORD_SECRET, {
        expiresIn: '10m',
    })
    return res.status(200).json({ message: 'success', token: resetPasswordToken })
    // return res.redirect(`${process.env.FRONTEND_RESET_PASSWORD_PAGE}/${resetPasswordToken}`)
})
// RESET PASSWORD /
export const resetPassword = asyncHandler(async (req = request, res = response, next) => {
    const { token } = req.params
    const { newPassword } = req.body
    if (!token) return next(new Error(`Invalid operation`, { cause: 400 }))
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET)
    if (!decoded) return next(new Error(`Invalid operation.`, { cause: 400 }))
    const user = await userModel.findOne({ email: decoded.email })
    if (!user) return next(new Error(`User not found, try again.`, { cause: 404 }))
    user.password = await bcrypt.hash(newPassword, parseInt(process.env.SALT_ROUND))
    user.changePasswordTime = Date.now()
    await user.save()
    return res.status(200).json({ message: 'success' })
})
// TODO // delete all users accounts, and delete all images that related to these accounts
export const deleteNotConfirmedUsers = asyncHandler(
    async (req = request, res = response, next) => {}
)
