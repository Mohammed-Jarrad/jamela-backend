import { admin, user } from '../../middlewares/auth.js'

export const endPoints = {
    create: [user],
    cancel: [user],
    getOrdersForUser: [user],
    getAll: [admin],
    changeStatus: [admin],
}
