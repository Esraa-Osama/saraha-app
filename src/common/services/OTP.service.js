//~ Assignment 9 ~//

import nodemailer from "nodemailer";
import { EMAIL_PASS, EMAIL_USER } from "../../../config/config.service.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async ({ email, otp } = {}) => {
  await transporter.sendMail({
    from: EMAIL_USER,
    to: email,
    subject: "Sara7a OTP",
    text: `Your OTP is: ${otp}`,
  });
};
