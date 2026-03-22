//~ Assignment 13 ~//

import { Router } from "express";
import {
  signup,
  signin,
  getProfile,
  otpVerification,
  resendOTP,
  signupAndSignInWithGmail,
  refreshToken,
  shareProfile,
  updateProfilePicture,
  updateProfile,
  updatePassword,
  logout,
  deleteProfilePicture,
  updateCoverPictures,
  profileVisitCount,
  forgotPassword,
  resetPassword,
  resendOTPResetPassword,
} from "./user.service.js";
import { authentication } from "../../common/middleware/authentication.middleware.js";
import { authorization } from "../../common/middleware/authorization.middleware.js";
import { roleEnum } from "../../common/enums/user.enum.js";
import { validation } from "../../common/middleware/validation.middleware.js";
import {
  confirmEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  shareProfileSchema,
  signInSchema,
  signUpSchema,
  updateCoverPicturesSchema,
  updatePasswordSchema,
  updateProfilePictureSchema,
  updateProfileSchema,
} from "./user.validation.js";
import {
  multerHD,
  multerHost,
} from "../../common/middleware/multer.middleware.js";
import { multerEnum } from "../../common/enums/multer.enum.js";
const userRouter = Router();

userRouter.post(
  "/signup",
  multerHD({ customPath: "users", filesTypes: multerEnum.image }).fields([
    {
      name: "profilePicture",
      maxCount: 1,
    },
    {
      name: "coverPictures",
      maxCount: 2,
    },
  ]),
  validation(signUpSchema),
  signup,
);

userRouter.patch(
  "/updateProfilePicture",
  authentication,
  multerHost(multerEnum.image).single("profilePicture"),
  validation(updateProfilePictureSchema),
  updateProfilePicture,
);

userRouter.patch(
  "/updateCoverPictures",
  authentication,
  multerHost(multerEnum.image).array("coverPictures"),
  validation(updateCoverPicturesSchema),
  updateCoverPictures,
);

userRouter.delete(
  "/deleteProfilePicture",
  authentication,
  deleteProfilePicture,
);

userRouter.post(
  "/otpVerification",
  validation(confirmEmailSchema),
  otpVerification,
);

userRouter.post("/resendOTP", resendOTP);

userRouter.post("/signin", validation(signInSchema), signin);

userRouter.get(
  "/profile",
  authentication,
  authorization([roleEnum.user]),
  getProfile,
);

userRouter.post("/signup/gmail", signupAndSignInWithGmail);

userRouter.get("/refreshToken", refreshToken);

userRouter.get(
  "/shareProfile/:id",
  validation(shareProfileSchema),
  shareProfile,
);

userRouter.patch(
  "/updateProfile",
  authentication,
  validation(updateProfileSchema),
  updateProfile,
);

userRouter.patch(
  "/updatePassword",
  authentication,
  authorization([roleEnum.user]),
  validation(updatePasswordSchema),
  updatePassword,
);

userRouter.post(
  "/forgotPassword",
  validation(forgotPasswordSchema),
  forgotPassword,
);

userRouter.post(
  "/resetPassword",
  validation(resetPasswordSchema),
  resetPassword,
);

userRouter.post("/resendOTPResetPassword", resendOTPResetPassword);

userRouter.post("/logout", authentication, logout);

userRouter.get(
  "/profileVisitCount",
  authentication,
  authorization(roleEnum.admin),
  profileVisitCount,
);

export default userRouter;
