//~ Assignment 9 ~//

import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

// Asymmetric decryption
const privateKey = process.env.ASYMMETRIC_PRIVATE_KEY.replace(/\\n/g, "\n");
export function AsymmetricDecrypt(encryptedText) {
  const decrypted = crypto.privateDecrypt(
    privateKey,
    Buffer.from(encryptedText, "hex"),
  );
  return decrypted.toString("utf-8");
}

// symmetric decryption
const symmetricKey = Buffer.from(process.env.SYMMETRIC_KEY, "hex");
export function symmetricDecrypt(text) {
  const [ivHex, encryptedText] = text.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", symmetricKey, iv);
  let decrypted = decipher.update(encryptedText, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
}
