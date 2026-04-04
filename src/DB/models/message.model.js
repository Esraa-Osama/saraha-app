//~ Assignment 14 ~//

import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      minLength: 1,
    },
    attachments: [String],
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
  },
  {
    timestamps: true,
    strictQuery: true,
  },
);

const messageModel =
  mongoose.models.message || mongoose.model("message", messageSchema);

export default messageModel;
