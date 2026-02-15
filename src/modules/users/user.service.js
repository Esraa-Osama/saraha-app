//~ Assignment 9 ~//

import { providerEnum } from "../../common/enums/user.enum.js";
import userModel from "../../DB/models/user.model.js";
import * as db_service from "../../DB/db.service.js";
import { successResponse } from "../../common/utils/response.success.js";
import { AsymmetricEncrypt } from "../../common/security/encrypt.security.js";
import { AsymmetricDecrypt } from "../../common/security/decrypt.security.js";
import { applyHash, compareHash } from "../../common/security/hash.security.js";
import dotenv from "dotenv";
import { generateToken } from "../../common/services/token.service.js";
import { generateOTP, sendOTP } from "../../common/services/OTP.service.js";
dotenv.config();

export const signup = async (req, res, next) => {
  const { userName, email, password, confirmPassword, age, gender, phone } =
    req.body;
  if (userName.split(" ").length < 2) {
    throw new Error("username must consist of two names", { cause: 400 });
  }
  if (password !== confirmPassword) {
    throw new Error("password and confirmPassword don't match", { cause: 400 });
  }
  if (await db_service.findOne({ model: userModel, filter: { email } })) {
    throw new Error("email already exists", { cause: 409 });
  }

  const otp = generateOTP();

  const user = await db_service.create({
    model: userModel,
    data: {
      userName,
      email,
      password: applyHash({
        originalText: password,
        saltRounds: process.env.SALT_ROUNDS,
      }),
      age,
      gender,
      phone: AsymmetricEncrypt(phone),
      isVerified: false,
      OTP: otp,
      OTPExpiryDate: Date.now() + Number(process.env.OTP_EXPIRE) * 60 * 1000,
    },
  });

  await sendOTP({ email, otp });
  successResponse({ res, message: "OTP sent to your gmail" });
};

export const signin = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      provider: providerEnum.system,
    },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }

  if (!user.isVerified) {
    throw new Error("Please verify your email first", { cause: 403 });
  }

  if (!compareHash({ originalText: password, hashedText: user.password })) {
    throw new Error("invalid password", { cause: 400 });
  }

  const access_token = generateToken({
    payload: { id: user._id },
    secret_key: process.env.JWT_SECRET_KEY,
    options: { expiresIn: Number(process.env.EXPIRES_IN) },
  });
  successResponse({
    res,
    data: { access_token },
  });
};

export const getProfile = async (req, res, next) => {
  const { password: _, ...safeUser } = req.user.toJSON();
  successResponse({
    res,
    data: { ...safeUser, phone: AsymmetricDecrypt(req.user.phone) },
  });
};

export const otpVerification = async (req, res, next) => {
  const { email, otp } = req.body;
  const user = await db_service.findOne({
    model: userModel,
    filter: { email },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }
  if (user.OTPExpiryDate < Date.now()) {
    user.isVerified = false;
    user.OTP = undefined;
    user.OTPExpiryDate = undefined;
    await user.save();
    throw new Error("OTP expired", { cause: 400 });
  }
  if (otp !== user.OTP) {
    throw new Error("invalid OTP", { cause: 400 });
  }
  user.isVerified = true;
  user.OTP = undefined;
  user.OTPExpiryDate = undefined;
  await user.save();
  successResponse({
    res,
    message: "account verified successfully, please login",
  });
};

export const resendOTP = async (req, res, next) => {
  const { email } = req.body;
  const user = await db_service.findOne({
    model: userModel,
    filter: { email },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }
  const otp = generateOTP();
  user.isVerified = false;
  user.OTP = otp;
  user.OTPExpiryDate = Date.now() + Number(process.env.OTP_EXPIRE) * 60 * 1000;
  await user.save();
  await sendOTP({ email, otp });
  successResponse({ res, message: "OTP sent to your gmail" });
};
