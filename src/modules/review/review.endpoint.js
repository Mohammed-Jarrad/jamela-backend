import { admin, user, roles } from "../../middlewares/auth.js";

export const endPoints = {
    create: [user],
    update: [user],
    delete: [admin, user],
}