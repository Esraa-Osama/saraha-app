//~ Assignment 12 ~//

import mongoose from "mongoose";
import { DB_CONNECTION_LINK } from "../../config/config.service.js";

export const checkConnection = () => {
  mongoose
    .connect(DB_CONNECTION_LINK, {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log("DB connected successfully");
    })
    .catch((error) => {
      console.log("DB connection failed", error);
    });
};
