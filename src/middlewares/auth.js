import jwt from 'jsonwebtoken'
import userModel from '../../DB/model/user.model.js'
import { request, response } from "express"

export const auth = (allowedRoles = []) => (req = request, res = response, next) => {
    const { authorization: authHeader } = req.headers || {}
    if (!authHeader?.startsWith(process.env.BEARER_KEY)) {
        return res.status(400).json({ message: 'Invalid authorization.' })
    }

    const token = authHeader.split(process.env.BEARER_KEY)[1]

    jwt.verify(token, process.env.LOGIN_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token.', action: 'logout' })
        }

        const user = await userModel.findById(decoded.id)
            .select('username email role changePasswordTime wishList')

        if (!user || allowedRoles.indexOf(user.role) === -1) {
            return res.status(user ? 403 : 404).json({
                message: user ? 'Not allowed.' : 'User not found.',
                action: 'logout',
            })
        }

        if (user.changePasswordTime && user.changePasswordTime > decoded.iat * 1000) {
            return next(new Error(`token expired`, { cause: 400 }))
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

