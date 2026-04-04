//~ Assignment 14 ~//

import { Router } from "express";
import { multerHD } from "../../common/middleware/multer.middleware.js";
import { validation } from "../../common/middleware/validation.middleware.js";
import { getMessage, getMessages, sendMessage } from "./message.service.js";
import { getMessageSchema, sendMessageSchema } from "./message.validation.js";
import { multerEnum } from "../../common/enums/multer.enum.js";
import { authentication } from "../../common/middleware/authentication.middleware.js";

const messageRouter = Router({ caseSensitive: true, strict: true });

messageRouter.post(
  "/send",
  multerHD({
    customPath: "messages",
    filesTypes: multerEnum.image,
  }).array("attachments", 3),
  validation(sendMessageSchema),
  sendMessage,
);

messageRouter.get(
  "/:messageId",
  authentication,
  validation(getMessageSchema),
  getMessage,
);

messageRouter.get("/", authentication, getMessages);

export default messageRouter;
