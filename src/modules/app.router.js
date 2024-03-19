import cors from 'cors'
import { request, response } from 'express'
import connectDB from '../../DB/connection.js'
import { globalErrorHandler } from '../utils/error.js'
import authRouter from './auth/auth.router.js'
import brandsRouter from './brand/brand.router.js'
import cartRouter from './cart/cart.router.js'
import categoriesRouter from './categories/categories.router.js'
import couponRouter from './coupon/coupon.router.js'
import imageRoutes from './image/image.router.js' 
import orderRouter from './order/order.router.js'
import productsRouter from './products/products.router.js'
import subcategoryRouter from './subcategory/subcategory.router.js'
import userRoutes from './user/user.router.js'

const initApp = (app, express) => {
    const whitelist = ['*', ...process.env.WHITE_LIST.split(',')]
    // CORS Configuration
    app.use(
        cors({
            origin: function (origin, callback) {
                if (whitelist.includes('*') || whitelist.indexOf(origin) !== -1) {
                    callback(null, true)
                } else {
                    callback('Not allowed by CORS', false)
                }
            },
        })
    )

    app.use(express.json())
    connectDB()
    app.get('/', (_, res) => {
        res.json('Welcome to E-commerce backend.')
    })
    app.use('/auth', authRouter)
    app.use('/users', userRoutes)
    app.use('/categories', categoriesRouter)
    app.use('/subcategory', subcategoryRouter)
    app.use('/products', productsRouter)
    app.use('/coupons', couponRouter)
    app.use('/carts', cartRouter)
    app.use('/orders', orderRouter)
    app.use('/images', imageRoutes)
    app.use('/brands', brandsRouter)
    app.get('*', (req = request, res = response) => {
        return res
            .status(404)
            .json({ message: 'Not Found ' + req.method + ' => ' + req.originalUrl })
    })

    app.use(globalErrorHandler)
}

export default initApp
