//~ Assignment 12 ~//

import { providerEnum } from "../../common/enums/user.enum.js";
import userModel from "../../DB/models/user.model.js";
import * as db_service from "../../DB/db.service.js";
import { successResponse } from "../../common/utils/response.success.js";
import { AsymmetricEncrypt } from "../../common/security/encrypt.security.js";
import { AsymmetricDecrypt } from "../../common/security/decrypt.security.js";
import { applyHash, compareHash } from "../../common/security/hash.security.js";
import {
  generateToken,
  verifyToken,
} from "../../common/services/token.service.js";
import { generateOTP, sendOTP } from "../../common/services/OTP.service.js";
import { OAuth2Client } from "google-auth-library";
import {
  ACCESS_EXPIRES_IN,
  CLIENT_ID,
  JWT_ACCESS_SECRET_KEY,
  JWT_REFRESH_SECRET_KEY,
  OTP_EXPIRE,
  PREFIX,
  REFRESH_EXPIRES_IN,
  SALT_ROUNDS,
} from "../../../config/config.service.js";
import cloudinary from "../../common/utils/cloudinary.js";
import { Types } from "mongoose";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import {
  deleteKey,
  get,
  getKey,
  getProfileKey,
  keys,
  revokedKey,
  set,
} from "../../DB/redis/redis.service.js";
import { resolve } from "node:path";

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

  const coverPaths = [];
  for (const file of req.files.coverPictures) {
    coverPaths.push(file.path);
  }

  const user = await db_service.create({
    model: userModel,
    data: {
      userName,
      email,
      password: applyHash({
        originalText: password,
        saltRounds: SALT_ROUNDS,
      }),
      age,
      gender,
      phone: AsymmetricEncrypt(phone),
      profilePicture: req.files.profilePicture[0].path,
      coverPictures: coverPaths,
      isVerified: false,
      OTP: otp,
      OTPExpiryDate: Date.now() + OTP_EXPIRE * 60 * 1000,
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

  const jwtid = randomUUID();

  const access_token = generateToken({
    payload: { id: user._id },
    secret_key: JWT_ACCESS_SECRET_KEY,
    options: { expiresIn: ACCESS_EXPIRES_IN, jwtid },
  });

  const refresh_token = generateToken({
    payload: { id: user._id },
    secret_key: JWT_REFRESH_SECRET_KEY,
    options: { expiresIn: REFRESH_EXPIRES_IN, jwtid },
  });
  successResponse({
    res,
    data: { access_token, refresh_token },
  });
};

export const getProfile = async (req, res, next) => {
  const { password: _, ...safeUser } = req.user.toJSON();
  const key = getProfileKey(safeUser._id);
  const userExists = await get(key);

  if (userExists) {
    return successResponse({
      res,
      data: { ...userExists, phone: AsymmetricDecrypt(userExists.phone) },
    });
  }

  await set({ key, value: safeUser, ttl: 60 });
  return successResponse({
    res,
    data: { ...safeUser, phone: AsymmetricDecrypt(safeUser.phone) },
  });
};

export const updateProfilePicture = async (req, res, next) => {
  const data = await cloudinary.uploader.upload(req.file.path, {
    folder: "sara7aApp/users",
  });
  req.data = data;
  const user = await db_service.findOne({
    model: userModel,
    filter: { _id: new Types.ObjectId(req.user.id) },
  });

  const updatedUser = await db_service.updateOne({
    model: userModel,
    filter: { _id: new Types.ObjectId(req.user.id) },
    updates: {
      $set: { profilePicture: data.secure_url, gallery: [user.profilePicture] },
    },
  });

  successResponse({
    res,
    message: "user updated successfully",
  });
};

export const deleteProfilePicture = async (req, res, next) => {
  if (req.user.profilePicture) {
    if (fs.existsSync(resolve(req.user.profilePicture))) {
      fs.unlinkSync(resolve(req.user.profilePicture));
      req.user.profilePicture = null;
      await req.user.save();
      return successResponse({
        res,
        message: "user profile picture deleted successfully",
      });
    }
  }
  return successResponse({
    res,
    message: "no profile picture to delete ",
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
  user.OTPExpiryDate = Date.now() + OTP_EXPIRE * 60 * 1000;
  await user.save();
  await sendOTP({ email, otp });
  successResponse({ res, message: "OTP sent to your gmail" });
};

export const signupAndSignInWithGmail = async (req, res, next) => {
  const { idToken } = req.body;
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken,
    audience: CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { name, email, email_verified, picture } = payload;
  let user = await db_service.findOne({ model: userModel, filter: { email } });
  if (!user) {
    user = await db_service.create({
      model: userModel,
      data: {
        userName: name,
        email,
        confirmed: email_verified,
        profilePicture: picture,
        provider: providerEnum.google,
      },
    });
  }

  if (user.provider == providerEnum.system) {
    throw new Error("sorry, you can sign in using system only", { cause: 400 });
  }

  const access_token = generateToken({
    payload: { id: user._id, email: user.email },
    secret_key: JWT_ACCESS_SECRET_KEY,
    options: { expiresIn: ACCESS_EXPIRES_IN },
  });
  successResponse({
    res,
    data: { access_token },
  });
};

export const refreshToken = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new Error("token not found", {
      cause: 401,
    });
  }

  const [prefix, token] = authorization.split(" ");
  if (prefix !== PREFIX) {
    throw new Error("invalid token prefix", {
      cause: 401,
    });
  }

  const decoded = verifyToken({
    token: token,
    secret_key: JWT_REFRESH_SECRET_KEY,
  });
  if (!decoded || !decoded?.id) {
    throw new Error("you are not allowed, invalid token", {
      cause: 401,
    });
  }
  const user = await db_service.findOne({
    model: userModel,
    filter: { _id: new Types.ObjectId(decoded.id) },
    options: { select: { password: 0 } },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }

  if (user?.changeCredential?.getTime() > decoded.iat * 1000) {
    throw new Error("invalid token", { cause: 404 });
  }

  const access_token = generateToken({
    payload: { id: user._id, email: user.email },
    secret_key: JWT_ACCESS_SECRET_KEY,
    options: {
      expiresIn: ACCESS_EXPIRES_IN,
    },
  });
  successResponse({
    res,
    data: { access_token },
  });
};

export const shareProfile = async (req, res, next) => {
  const { id } = req.params;
  const user = await db_service.findOne({
    model: userModel,
    filter: { _id: new Types.ObjectId(id) },
    options: { select: "-password" },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }
  successResponse({
    res,
    data: { ...user._doc, phone: AsymmetricDecrypt(user.phone) },
  });
};

export const updateProfile = async (req, res, next) => {
  let { firstName, lastName, email, gender, phone } = req.body;
  if (phone) {
    phone = AsymmetricEncrypt(phone);
  }
  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { _id: new Types.ObjectId(req.user._id) },
    updates: {
      firstName,
      lastName,
      email,
      gender,
      phone,
    },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }
  await deleteKey(`profile::${req.user._id}`);
  successResponse({ res, data: user });
};

export const updatePassword = async (req, res, next) => {
  let { oldPassword, newPassword } = req.body;

  if (
    !compareHash({ originalText: oldPassword, hashedText: req.user.password })
  ) {
    throw new Error("invalid old password");
  }

  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { _id: new Types.ObjectId(req.user._id) },
    updates: {
      password: applyHash({ originalText: newPassword, saltRounds: 12 }),
    },
  });

  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }

  successResponse({ res, message: "password updated successfully" });
};

export const logout = async (req, res, next) => {
  const { flag } = req.query;
  if (flag === "all") {
    req.user.changeCredential = new Date();
    await req.user.save();
    await deleteKey(await keys(getKey(req.user._id)));
  } else {
    await set({
      key: revokedKey({ userId: req.user._id, jti: req.decoded.jti }),
      value: `${req.decoded.jti}`,
      ttl: req.decoded.exp - Math.floor(Date.now() / 1000),
    });
  }
  successResponse({ res });
};
