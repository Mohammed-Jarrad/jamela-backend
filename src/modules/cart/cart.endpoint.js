import { admin, user } from '../../middlewares/auth.js'

export const endpoints = {
    create: [user],
    removeItem: [user],
    updateQuantity: [user],
	updateSizeOrColor: [user],
    clearCart: [user],
    get: [user],
    getAll: [admin],
}
