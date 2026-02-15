//~ Assignment 9 ~//

import express from "express";
import { checkConnection } from "./DB/dbConnection.js";
import userRouter from "./modules/users/user.controller.js";
import { successResponse } from "./common/utils/response.success.js";
const app = express();
const port = 5000;

const bootstrap = () => {
  checkConnection();
  app.use(express.json());

  app.get("/", (req, res, next) => {
    successResponse({ res, message: "WELCOME TO MY APP...." });
  });

  app.use("/users", userRouter);

  app.use("{/*demo}", (req, res, next) => {
    throw new Error(`404 page ${req.originalUrl} not found`, { cause: 404 });
  });

  app.use((err, req, res, next) => {
    res
      .status(err.cause || 500)
      .json({ message: err.message, stack: err.stack });
  });

  app.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
};

export default bootstrap;
