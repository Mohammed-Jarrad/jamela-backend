import { admin, user } from "../../middlewares/auth.js";

export const endPoints = {
    getAll: [admin],
    create: [user],
    update: [user],
    delete: [admin, user],
}