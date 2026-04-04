//~ Assignment 14 ~//

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
  banKey,
  blockOtpKey,
  deleteKey,
  get,
  getKey,
  getProfileKey,
  incr,
  keys,
  maxOtpKey,
  maxPasswordTries,
  otpKey,
  revokedKey,
  set,
  ttl,
  update,
} from "../../DB/redis/redis.service.js";
import { resolve } from "node:path";
import { event } from "../../common/services/event.service.js";
import { emailEnum } from "../../common/enums/email.enum.js";

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
    coverPaths.push({ public_id: file.path, secure_url: file.path });
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
      profilePicture: {
        public_id: req.files.profilePicture[0].path,
        secure_url: req.files.profilePicture[0].path,
      },
      coverPictures: coverPaths,
      isVerified: false,
      OTP: applyHash({ originalText: `${otp}` }),
      OTPExpiryDate: Date.now() + OTP_EXPIRE * 60 * 1000,
      otpMax: 1,
      OTPMaxExpiryDate: Date.now() + 0.5 * 60 * 1000,
    },
  });

  event.emit(emailEnum.confirmEmail, async () => {
    await sendOTP({ email, otp });
  });

  await set({ key: maxPasswordTries(email), value: 1 });
  await set({ key: maxOtpKey(email), value: 0 });
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

  const isBanned = await ttl(banKey(email));
  if (isBanned > 0) {
    await set({ key: maxPasswordTries(email), value: 1 });
    throw new Error(`you can try after ${Math.ceil(isBanned / 60)} minutes`, {
      cause: 400,
    });
  }

  if ((await get(maxPasswordTries(email))) >= 5) {
    await set({ key: banKey(email), value: 1, ttl: 60 * 5 });
    throw new Error(
      `invalid password, you can try again after ${Math.ceil((await ttl(banKey(email))) / 60)} minutes`,
      { cause: 400 },
    );
  }

  if (!compareHash({ originalText: password, hashedText: user.password })) {
    await incr(maxPasswordTries(email));
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
    folder: "sara7aApp/users/profile",
  });
  req.data = data;
  const gallery = req.user.gallery;
  gallery.push(req.user.profilePicture);
  const updatedUser = await db_service.updateOne({
    model: userModel,
    filter: { _id: new Types.ObjectId(req.user.id) },
    updates: {
      $set: {
        profilePicture: {
          public_id: data.public_id,
          secure_url: data.secure_url,
        },
        gallery,
      },
    },
  });

  successResponse({
    res,
    message: "user profile picture updated successfully",
  });
};

export const updateCoverPictures = async (req, res, next) => {
  const existingFiles = req.user.coverPictures;
  let coverPaths = [];
  for (const file of req.files) {
    const data = await cloudinary.uploader.upload(file.path, {
      folder: "sara7aApp/users/cover",
    });
    coverPaths.push({ public_id: data.public_id, secure_url: data.secure_url });
  }

  let allFiles = [...existingFiles, ...coverPaths];

  if (allFiles.length > 2) {
    const deletedFiles = allFiles.splice(0, allFiles.length - 2);

    for (const file of deletedFiles) {
      await cloudinary.uploader.destroy(file.public_id);
    }
  }

  await db_service.updateOne({
    model: userModel,
    filter: { _id: new Types.ObjectId(req.user._id) },
    updates: {
      $set: { coverPictures: allFiles },
    },
  });

  successResponse({
    res,
    message: "user cover pictures updated successfully",
  });
};

export const deleteProfilePicture = async (req, res, next) => {
  if (req.user?.profilePicture?.secure_url) {
    if (fs.existsSync(resolve(req.user.profilePicture.secure_url))) {
      fs.unlinkSync(resolve(req.user.profilePicture.secure_url));
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
    filter: {
      email,
      provider: providerEnum.system,
    },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }
  if (!user.OTP || !user.OTPExpiryDate) {
    throw new Error("OTP expired", { cause: 400 });
  }
  if (user.OTPExpiryDate < Date.now()) {
    user.isVerified = false;
    user.OTP = undefined;
    user.OTPExpiryDate = undefined;
    await user.save();
    throw new Error("OTP expired", { cause: 400 });
  }
  if (!compareHash({ originalText: otp, hashedText: user.OTP })) {
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
    filter: { email, isVerified: false, provider: providerEnum.system },
  });
  if (!user) {
    throw new Error("user not found or already confirmed", { cause: 404 });
  }

  if (user.blockOtpExpiryDate > Date.now()) {
    throw new Error(
      `you are blocked, please try again after ${Math.ceil(
        (user.blockOtpExpiryDate - Date.now()) / 1000,
      )} seconds`,
      {
        cause: 400,
      },
    );
  }

  if (user.OTPExpiryDate > Date.now()) {
    throw new Error(
      `you can resend otp after ${Math.floor((user.OTPExpiryDate - Date.now()) / 1000)} seconds`,
      {
        cause: 400,
      },
    );
  }

  if (user.otpMax >= 3) {
    user.blockOtp = true;
    user.blockOtpExpiryDate = Date.now() + 1 * 60 * 1000;
    user.otpMax = 0;
    await user.save();
    throw new Error("you have exceeded the maximum number of tries", {
      cause: 400,
    });
  }

  const otp = generateOTP();
  event.emit(emailEnum.confirmEmail, async () => {
    user.isVerified = false;
    user.OTP = applyHash({ originalText: `${otp}` });
    user.OTPExpiryDate = Date.now() + OTP_EXPIRE * 60 * 1000;
    user.otpMax += 1;
    await user.save();
    await sendOTP({ email, otp });
  });

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
  await db_service.updateOne({
    model: userModel,
    filter: { _id: new Types.ObjectId(user._id) },
    updates: {
      $inc: { visitCount: 1 },
    },
  });
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
      changeCredential: new Date(),
    },
  });

  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }

  successResponse({ res, message: "password updated successfully" });
};

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      provider: providerEnum.system,
      isVerified: true,
    },
  });

  if (!user) {
    throw new Error("user not found or invalid provider or not verified", {
      cause: 404,
    });
  }

  const isBlocked = await ttl(blockOtpKey(email));
  if (isBlocked > 0) {
    throw new Error(
      `you are blocked, please try again after ${isBlocked} seconds`,
      {
        cause: 400,
      },
    );
  }

  const otpTtl = await ttl(otpKey(email));
  if (otpTtl > 0) {
    throw new Error(`you can resend otp after ${otpTtl} seconds`, {
      cause: 400,
    });
  }

  const maxOtp = await get(maxOtpKey(email));
  if (maxOtp >= 3) {
    await set({
      key: blockOtpKey(email),
      value: true,
      ttl: 60,
    });
    await update({
      key: maxOtpKey(email),
      value: 0,
      ttl: 30,
    });
    throw new Error("you have exceeded the maximum number of tries", {
      cause: 400,
    });
  }

  const otp = generateOTP();

  event.emit(emailEnum.forgetPassword, async () => {
    await sendOTP({ email, otp });

    await set({
      key: otpKey(email),
      value: applyHash({ originalText: `${otp}` }),
      ttl: 60 * 2,
    });

    await incr(maxOtpKey(email));
  });

  successResponse({ res, message: "otp sent to your email" });
};

export const resetPassword = async (req, res, next) => {
  const { code, email, newPassword } = req.body;

  if (!((await ttl(otpKey(email))) > 0)) {
    throw new Error("otp expired", { cause: 400 });
  }

  if (
    !compareHash({ originalText: code, hashedText: await get(otpKey(email)) })
  ) {
    throw new Error("invalid otp", { cause: 400 });
  }

  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: { email, provider: providerEnum.system, isVerified: true },
    updates: {
      password: applyHash({ originalText: newPassword }),
      changeCredential: new Date(),
    },
  });

  if (!user) {
    throw new Error("user not found or invalid provider or not verified", {
      cause: 404,
    });
  }

  await deleteKey(otpKey(email));

  successResponse({ res, message: "password was reset successfully" });
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

export const profileVisitCount = async (req, res, next) => {
  successResponse({ res, data: { visitCount: req.user.visitCount } });
};
