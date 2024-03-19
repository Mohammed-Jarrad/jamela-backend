import { request, response } from 'express'
import jwt from 'jsonwebtoken'
import userModel from '../../DB/model/user.model.js'

export const auth = (allowedRoles = []) => {
    return async (req = request, res = response, next) => {
        const { authorization } = req.headers
        // check if authorization is valid
        if (!authorization?.startsWith(process.env.BEARER_KEY))
            return res.status(400).json({ message: 'Invalid authorization.' })

        const token = authorization.split(process.env.BEARER_KEY)[1]
        const decoded = jwt.verify(token, process.env.LOGIN_SECRET)
        const user = await userModel
            .findById(decoded.id)
            .select('username email role changePasswordTime wishList')
        //  check if user is valid
        if (!user) return res.status(404).json({ message: 'User not found.', action: 'logout' })
        //  check if token is expired
        if (user.changePasswordTime)
            if (parseInt(user.changePasswordTime.getTime() / 1000) > decoded.iat)
                return next(new Error(`token expired`, { cause: 400 }))
        // check if user role is allowed
        if (!allowedRoles.includes(user.role))
            return res.status(403).json({ message: 'Not allowed.' })
        // set user to req.user
        req.user = user
        next()
    }
}

export const roles = {
    admin: 'Admin',
    user: 'User',
}
export const { admin, user } = roles
