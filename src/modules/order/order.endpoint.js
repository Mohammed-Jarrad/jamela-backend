import { admin, user } from '../../middlewares/auth.js'

export const endPoints = {
    create: [user],
    cancel: [user],
    getOrdersForUser: [user],
    getAll: [admin],
    changeStatus: [admin],
    changeCoupon: [user],
    removeCoupon: [user],
    editNote: [user],
    delete: [admin],
    acceptAll: [admin]
}
