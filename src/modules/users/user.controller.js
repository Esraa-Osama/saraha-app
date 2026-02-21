//~ Assignment 9 ~//

import { Router } from "express";
import {
  signup,
  signin,
  getProfile,
  otpVerification,
  resendOTP,
  signupAndSignInWithGmail,
} from "./user.service.js";
import { authentication } from "../../common/middleware/authentication.middleware.js";
import { authorization } from "../../common/middleware/authorization.middleware.js";
import { roleEnum } from "../../common/enums/user.enum.js";
import { validation } from "../../common/middleware/validation.middleware.js";
import { signInSchema, signUpSchema } from "./user.validation.js";
const userRouter = Router();

userRouter.post("/signup", validation(signUpSchema), signup);
userRouter.post("/otpVerification", otpVerification);
userRouter.post("/resendOTP", resendOTP);
userRouter.post("/signin", validation(signInSchema), signin);
userRouter.get(
  "/profile",
  authentication,
  authorization([roleEnum.user]),
  getProfile,
);
userRouter.post("/signup/gmail", signupAndSignInWithGmail);

export default userRouter;
