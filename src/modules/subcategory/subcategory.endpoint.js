import { admin } from '../../middlewares/auth.js'

export const endPoints = {
    create: [admin],
    update: [admin],
    delete: [admin],
    getAll: [admin]
}
