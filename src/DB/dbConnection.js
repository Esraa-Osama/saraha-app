//~ Assignment 9 ~//

import mongoose from "mongoose";

export const checkConnection = () => {
  mongoose
    .connect("mongodb://127.0.0.1:27017/sara7aApp_Assignment9", {
      serverSelectionTimeoutMS: 5000,
    })
    .then(() => {
      console.log("DB connected successfully");
    })
    .catch((error) => {
      console.log("DB connection failed", error);
    });
};
