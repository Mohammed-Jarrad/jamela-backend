import { Router } from "express";
import * as brandController from "./brand.controller.js";
import * as validator from "./brand.validation.js"
import { auth } from "../../middlewares/auth.js"
import { validation } from "../../middlewares/validation.js"

const router = Router();    

export default router