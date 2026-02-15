//~ Assignment 9 ~//

import { Router } from "express";
import {
  signup,
  signin,
  getProfile,
  otpVerification,
  resendOTP,
} from "./user.service.js";
import { authentication } from "../../common/middleware/auth.middleware.js";
const userRouter = Router();

userRouter.post("/signup", signup);
userRouter.post("/otpVerification", otpVerification);
userRouter.post("/resendOTP", resendOTP);
userRouter.post("/signin", signin);
userRouter.get("/profile", authentication, getProfile);

export default userRouter;
