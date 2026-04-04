//~ Assignment 14 ~//

import joi from "joi";
import { Types } from "mongoose";

export const sendMessageSchema = {
  body: joi
    .object({
      content: joi.string().required(),
      receiverId: joi
        .string()
        .custom((value, helper) => {
          const isValid = Types.ObjectId.isValid(value);
          return isValid ? value : helper.message("invalid id");
        })
        .required(),
    })
    .required()
    .messages({
      "any.required": "body must not be empty",
    }),

  files: joi.array().items(
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
  ),
};

export const getMessageSchema = {
  params: joi
    .object({
      messageId: joi
        .string()
        .custom((value, helper) => {
          const isValid = Types.ObjectId.isValid(value);
          return isValid ? value : helper.message("invalid id");
        })
        .required(),
    })
    .required()
    .messages({
      "any.required": "params must not be empty",
    }),
};
