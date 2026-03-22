//~ Assignment 13 ~//

import crypto from "crypto";
import {
  ASYMMETRIC_PRIVATE_KEY,
  SYMMETRIC_KEY,
} from "../../../config/config.service.js";

// Asymmetric decryption
const privateKey = ASYMMETRIC_PRIVATE_KEY.replace(/\\n/g, "\n");
export function AsymmetricDecrypt(encryptedText) {
  const decrypted = crypto.privateDecrypt(
    privateKey,
    Buffer.from(encryptedText, "hex"),
  );
  return decrypted.toString("utf-8");
}

// symmetric decryption
const symmetricKey = Buffer.from(SYMMETRIC_KEY, "hex");
export function symmetricDecrypt(text) {
  const [ivHex, encryptedText] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", symmetricKey, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
}
