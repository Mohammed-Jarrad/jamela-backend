import { admin } from '../../middlewares/auth.js'

export const endPoints = {
    create: [admin],
    getAll: [admin],
    update: [admin],
    delete: [admin],
}
