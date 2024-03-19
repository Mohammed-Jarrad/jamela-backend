import { admin } from '../../middlewares/auth.js'

export const endPoints = {
    getAll: [admin],
    changeRoleAndStatus: [admin],
    delete: [admin]
}
