//~ Assignment 9 ~//

import joi from "joi";
import { genderEnum } from "../../common/enums/user.enum.js";

export const signUpSchema = joi
  .object({
    userName: joi.string().min(10).max(40).required(),
    email: joi.string().email().required(),
    password: joi.string().min(20).max(40).required(),
    confirmPassword: joi
      .string()
      .min(20)
      .max(40)
      .required()
      .valid(joi.ref("password")),
    age: joi.number().required(),
    gender: joi.valid(genderEnum.male, genderEnum.female).required(),
    phone: joi.string().required(),
  })
  .required();

export const signInSchema = joi
  .object({
    email: joi.string().email().required(),
    password: joi.string().min(20).max(40).required(),
  })
  .required();
