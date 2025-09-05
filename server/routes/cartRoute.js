import { updateCart } from "../controllers/cartContoller.js";
import { authUser } from "../middleware/authUser.js";
import express from 'express';



const cartRouter = express.Router();
cartRouter.post('/update',authUser,updateCart)
export default cartRouter;
