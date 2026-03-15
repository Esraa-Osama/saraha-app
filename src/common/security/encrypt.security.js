//~ Assignment 12 ~//

import crypto from "crypto";
import {
  ASYMMETRIC_PUBLIC_KEY,
  SYMMETRIC_KEY,
} from "../../../config/config.service.js";

// Asymmetric encryption
const publicKey = ASYMMETRIC_PUBLIC_KEY.replace(/\\n/g, "\n");
export function AsymmetricEncrypt(originalText) {
  const encrypted = crypto.publicEncrypt(publicKey, Buffer.from(originalText));
  return encrypted.toString("hex");
}

// symmetric encryption
const symmetricKey = Buffer.from(SYMMETRIC_KEY, "hex");
const IV_LENGTH = 16;
export function symmetricEncrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", symmetricKey, iv);
  let encrypted = cipher.update(text, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}
