import {admin, user} from '../../middlewares/auth.js'

export const endpoint = {
    create: [admin],
    getAll: [admin],
    update: [admin],
    delete: [admin]
}