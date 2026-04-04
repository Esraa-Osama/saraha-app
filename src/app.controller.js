//~ Assignment 14 ~//

import express from "express";
import { checkConnection } from "./DB/dbConnection.js";
import userRouter from "./modules/users/user.controller.js";
import { successResponse } from "./common/utils/response.success.js";
import cors from "cors";
import { PORT, WHITE_LIST } from "../config/config.service.js";
import { redisConnection } from "./DB/redis/redis.db.js";
import { set } from "./DB/redis/redis.service.js";
import fs from "node:fs";
import { resolve } from "node:path";
import cloudinary from "./common/utils/cloudinary.js";
import messageRouter from "./modules/messages/message.controller.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();
const port = PORT;

const bootstrap = async () => {
  checkConnection();
  redisConnection();

  const limiter = rateLimit({
    windowMs: 60 * 5 * 1000,
    limit: 5,
    legacyHeaders: false,
  });

  const whiteList = [...WHITE_LIST, undefined];
  const corsOptions = {
    origin: function (origin, callback) {
      if (whiteList.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("you are not allowed by CORS"));
      }
    },
  };

  app.use(cors(corsOptions), helmet(), limiter, express.json());
  app.use("/uploads", express.static("uploads"));

  app.get("/", (req, res, next) => {
    successResponse({ res, message: "WELCOME TO MY APP...." });
  });

  app.use("/users", userRouter);
  app.use("/messages", messageRouter);

  app.use("{/*demo}", (req, res, next) => {
    throw new Error(`404 page ${req.originalUrl} not found`, { cause: 404 });
  });

  app.use(async (err, req, res, next) => {
    if (req.files?.profilePicture?.length > 0) {
      fs.unlinkSync(resolve(req.files.profilePicture[0].path));
    }
    if (req.files?.coverPictures?.length > 0) {
      for (const file of req.files.coverPictures) {
        fs.unlinkSync(resolve(file.path));
      }
    }
    if (req.data) {
      await cloudinary.uploader.destroy(req.data.public_id);
    }
    res
      .status(err.cause || 500)
      .json({ message: err.message, stack: err.stack });
  });

  app.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
};

export default bootstrap;
