import { request, response } from 'express'
import jwt from 'jsonwebtoken'
import User from '../../DB/model/user.model.js'

export const auth =
    (allowedRoles = []) =>
    (req = request, res = response, next) => {
        const { authorization } = req.headers || {}
        if (!authorization?.startsWith(process.env.BEARER_KEY)) {
            return res.status(400).json({ message: 'Invalid authorization.' })
        }

        const token = authorization.split(process.env.BEARER_KEY)[1]

        jwt.verify(token, process.env.LOGIN_SECRET, {}, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: 'Invalid token, ' + err.message, logout: true })
            }

            const user = await User.findById(decoded._id).select('username email role changePasswordTime wishList')

            if (!user) {
                return res.status(404).json({ message: 'User not found.', logout: true })
            }

            if (allowedRoles.indexOf(user.role) === -1) {
                return res.status(403).json({
                    message: 'You are not allowed to perform this action.',
                })
            }

            if (user.changePasswordTime && user.changePasswordTime > decoded.iat * 1000) {
                return res.status(401).json({ message: 'Token expired.', logout: true })
            }

            req.user = user
            next()
        })
    }

export const roles = {
    admin: 'Admin',
    user: 'User',
}
export const { admin, user } = roles
