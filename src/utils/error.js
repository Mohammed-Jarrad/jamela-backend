import { request, response } from 'express'

export const asyncHandler = (fn) => {
    return async (req = request, res = response, next) => {
        try {
            await fn(req, res, next)
        } catch (error) {
            // handle unique field error
            if (error.code === 11000) {
                return next(new Error('Unique field already exists.', { cause: 400 }))
            }
            // handle validation error
            if (error.name === 'ValidationError') {
                const messages = []
                Object.keys(error.errors).forEach((key) => {
                    messages.push(error.errors[key].message)
                })
                return res.status(400).json({ messages, message: 'Validation error.' })
            }

            // handle error
            return next(new Error(error.message || 'Internal Server Error', { cause: error.status || 500 }))
        }
    }
}

export const globalErrorHandler = (err, _req, res, _next) => {
    console.log(err)
    console.log('stack: ', err.stack)

    // handle error
    return res.status(err.cause || 500).json({ message: err.message || 'Internal Server Error' })
}
