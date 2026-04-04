//~ Assignment 14 ~//

import { EventEmitter } from "node:events";
import { emailEnum } from "../enums/email.enum.js";

export const event = new EventEmitter();

event.on(emailEnum.confirmEmail, async (fn) => {
  await fn();
});

event.on(emailEnum.forgetPassword, async (fn) => {
  await fn();
});
