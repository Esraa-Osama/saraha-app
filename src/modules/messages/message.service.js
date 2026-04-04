//~ Assignment 14 ~//

import { successResponse } from "../../common/utils/response.success.js";
import * as db_service from "../../DB/db.service.js";
import messageModel from "../../DB/models/message.model.js";
import userModel from "../../DB/models/user.model.js";

export const sendMessage = async (req, res, next) => {
  const { content, receiverId } = req.body;

  const userExists = await db_service.findOne({
    model: userModel,
    filter: { _id: receiverId },
  });
  if (!userExists) {
    throw new Error("receiver user not found", { cause: 404 });
  }

  const filesPaths = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      filesPaths.push(file.path);
    }
  }

  const message = await db_service.create({
    model: messageModel,
    data: { content, receiverId, attachments: filesPaths },
  });

  successResponse({ res, status: 201, data: message });
};

export const getMessage = async (req, res, next) => {
  const { messageId } = req.params;

  const message = await db_service.findOne({
    model: messageModel,
    filter: { _id: messageId, receiverId: req.user._id },
  });

  if (!message) {
    throw new Error("message not found or you are not the right receiver", {
      cause: 404,
    });
  }

  successResponse({ res, data: message });
};

export const getMessages = async (req, res, next) => {
  const messages = await db_service.find({
    model: messageModel,
    filter: { receiverId: req.user._id },
  });

  if (messages.length <= 0) {
    throw new Error("no messages found or you are not the right receiver", {
      cause: 404,
    });
  }

  successResponse({ res, data: messages });
};
