import express from 'express';
import { login, signup } from '../controller/AuthController.js';
import { signupSchema, validateRequest } from '../middleware/validateRequest.js';

const userRouter = express.Router();

userRouter.post('/login', login);
userRouter.post('/signup', validateRequest(signupSchema), signup);


export default userRouter