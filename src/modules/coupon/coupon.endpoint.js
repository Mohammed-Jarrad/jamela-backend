import { admin, user } from "../../middlewares/auth.js";

export const endPoints = {
    create: [admin],
    getAll: [admin],
    update: [admin],
    hardDelete: [admin],
    softDelete: [admin],
    restore: [admin],
    getSingle: [admin],
    checkCoupon: [user]
}