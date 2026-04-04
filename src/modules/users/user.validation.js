//~ Assignment 14 ~//

import joi from "joi";
import { genderEnum } from "../../common/enums/user.enum.js";

export const signUpSchema = {
  body: joi
    .object({
      userName: joi.string().min(10).max(40).required().messages({
        "string.base": "username must be a string",
        "string.min": "username must be more than or equal 10 characters",
        "string.max": "username must be less than or equal 40 characters",
        "any.required": "username is required",
      }),
      email: joi.string().email().required().messages({
        "string.email": "invalid email format",
        "any.required": "email is required",
      }),
      password: joi.string().min(20).max(40).required().messages({
        "string.min": "password must be more than or equal 20 characters",
        "string.max": "password must be less than or equal 40 characters",
        "any.required": "password is required",
      }),
      confirmPassword: joi
        .string()
        .min(20)
        .max(40)
        .required()
        .valid(joi.ref("password"))
        .messages({
          "string.min":
            "confirmPassword must be more than or equal 20 characters",
          "string.max":
            "confirmPassword must be less than or equal 40 characters",
          "any.required": "confirmPassword is required",
          "any.only": "confirmPassword doesn't match password",
        }),
      age: joi.number().required().messages({
        "number.base": "age must be a number",
        "any.required": "age is required",
      }),
      gender: joi
        .valid(genderEnum.male, genderEnum.female)
        .required()
        .messages({
          "any.only": "gender must be one of two values (male, female)",
          "any.required": "gender is required",
        }),
      phone: joi.string().required().messages({
        "any.required": "phone is required",
      }),
    })
    .required()
    .messages({ "any.required": "body is required" }),

  files: joi
    .object({
      profilePicture: joi
        .array()
        .max(1)
        .items(
          joi.object({
            fieldname: joi.string().required(),
            originalname: joi.string().required(),
            encoding: joi.string().required(),
            mimetype: joi.string().required(),
            destination: joi.string().required(),
            filename: joi.string().required(),
            path: joi.string().required(),
            size: joi.number().required(),
          }),
        )
        .required()
        .messages({
          "any.required": "profilePicture is required",
        }),
      coverPictures: joi
        .array()
        .max(2)
        .items(
          joi.object({
            fieldname: joi.string().required(),
            originalname: joi.string().required(),
            encoding: joi.string().required(),
            mimetype: joi.string().required(),
            destination: joi.string().required(),
            filename: joi.string().required(),
            path: joi.string().required(),
            size: joi.number().required(),
          }),
        )
        .required()
        .messages({
          "any.required": "coverPictures are required",
        }),
    })
    .required()
    .messages({
      "any.required": "files are required",
    }),
};

export const signInSchema = {
  body: joi
    .object({
      email: joi.string().email().required().messages({
        "string.email": "invalid email format",
        "any.required": "email is required",
      }),
      password: joi.string().min(20).max(40).required().messages({
        "string.min": "password must be more than or equal 20 characters",
        "string.max": "password must be less than or equal 40 characters",
        "any.required": "password is required",
      }),
    })
    .required()
    .messages({ "any.required": "body is required" }),
};

export const updateProfilePictureSchema = {
  file: joi
    .object({
      fieldname: joi.string().required(),
      originalname: joi.string().required(),
      encoding: joi.string().required(),
      mimetype: joi.string().required(),
      destination: joi.string().required(),
      filename: joi.string().required(),
      path: joi.string().required(),
      size: joi.number().required(),
    })
    .required()
    .messages({
      "any.required": "profilePicture is required",
    }),
};

export const updateCoverPicturesSchema = {
  files: joi
    .array()
    .max(2)
    .items(
      joi
        .object({
          fieldname: joi.string().required(),
          originalname: joi.string().required(),
          encoding: joi.string().required(),
          mimetype: joi.string().required(),
          destination: joi.string().required(),
          filename: joi.string().required(),
          path: joi.string().required(),
          size: joi.number().required(),
        })
        .required()
        .messages({
          "any.required": "coverPictures are required",
        }),
    )
    .required()
    .messages({
      "any.required": "files are required",
    }),
};

export const shareProfileSchema = {
  params: joi
    .object({
      id: joi.string().length(24).hex().required(),
    })
    .required()
    .messages({
      "any.required": "id param is required",
    }),
};

export const updateProfileSchema = {
  body: joi
    .object({
      firstName: joi.string().min(3).max(20),
      lastName: joi.string().min(3).max(20),
      email: joi.string(),
      gender: joi.string().valid(genderEnum.male, genderEnum.female),
      phone: joi.string(),
    })
    .required()
    .messages({
      "any.required": "body must not be empty",
    }),
};

export const updatePasswordSchema = {
  body: joi
    .object({
      oldPassword: joi.string().min(20).max(40).required(),
      newPassword: joi.string().min(20).max(40).required(),
      confirmPassword: joi.string().min(10).valid(joi.ref("newPassword")),
    })
    .required()
    .messages({
      "any.required": "body must not be empty",
    }),
};

export const forgotPasswordSchema = {
  body: joi
    .object({
      email: joi.string().required(),
    })
    .required()
    .messages({
      "any.required": "body must not be empty",
    }),
};

export const resetPasswordSchema = {
  body: joi
    .object({
      code: joi.string().length(6).required(),
      email: joi.string().required(),
      newPassword: joi.string().min(20).max(40).required(),
      confirmPassword: joi.string().min(10).valid(joi.ref("newPassword")),
    })
    .required()
    .messages({
      "any.required": "body must not be empty",
    }),
};

export const confirmEmailSchema = {
  body: joi
    .object({
      email: joi.string().required(),
      otp: joi.string().length(6).required(),
    })
    .required()
    .messages({
      "any.required": "body must not be empty",
    }),
};
