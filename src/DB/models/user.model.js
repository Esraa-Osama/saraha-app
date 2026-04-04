//~ Assignment 14 ~//

import mongoose from "mongoose";
import {
  genderEnum,
  providerEnum,
  roleEnum,
} from "../../common/enums/user.enum.js";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 10,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      minLength: 3,
      maxLength: 10,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider == providerEnum.google ? false : true;
      },
      minLength: 6,
      trim: true,
    },
    age: Number,
    gender: {
      type: String,
      enum: Object.values(genderEnum),
      required: function () {
        return this.provider == providerEnum.google ? false : true;
      },
    },
    phone: {
      type: String,
      required: function () {
        return this.provider == providerEnum.google ? false : true;
      },
    },
    profilePicture: { public_id: String, secure_url: String },
    coverPictures: [{ public_id: String, secure_url: String }],
    gallery: [{ public_id: String, secure_url: String }],
    changeCredential: Date,
    confirmed: Boolean,
    isVerified: Boolean,
    OTP: String,
    OTPExpiryDate: Date,
    otpMax: Number,
    OTPMaxExpiryDate: Date,
    blockOtp: Number,
    blockOtpExpiryDate: Date,
    provider: {
      type: String,
      enum: Object.values(providerEnum),
      default: providerEnum.system,
    },
    role: {
      type: String,
      enum: Object.values(roleEnum),
      default: roleEnum.user,
    },
    visitCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    strictQuery: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

userSchema
  .virtual("userName")
  .get(function () {
    return this.firstName + " " + this.lastName;
  })
  .set(function (value) {
    const [firstName, lastName] = value.split(" ");
    this.set({ firstName, lastName });
  });

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
