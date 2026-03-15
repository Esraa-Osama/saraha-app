//~ Assignment 12 ~//

import { resolve } from "path";
import dotenv from "dotenv";

const NODE_ENV = process.env.NODE_ENV;
let envPaths = {
  development: ".env.development",
  production: ".env.production",
};
dotenv.config({ path: resolve(`config/${envPaths[NODE_ENV]}`) });

export const DB_CONNECTION_LINK = process.env.DB_CONNECTION_LINK;
export const PORT = Number(process.env.PORT);
export const ASYMMETRIC_PUBLIC_KEY = process.env.ASYMMETRIC_PUBLIC_KEY;
export const ASYMMETRIC_PRIVATE_KEY = process.env.ASYMMETRIC_PRIVATE_KEY;
export const SYMMETRIC_KEY = process.env.SYMMETRIC_KEY;
export const SALT_ROUNDS = Number(process.env.SALT_ROUNDS);
export const JWT_ACCESS_SECRET_KEY = process.env.JWT_ACCESS_SECRET_KEY;
export const ACCESS_EXPIRES_IN = Number(process.env.ACCESS_EXPIRES_IN);
export const JWT_REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET_KEY;
export const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN;
export const PREFIX = process.env.PREFIX;
export const EMAIL_USER = process.env.EMAIL_USER;
export const EMAIL_PASS = process.env.EMAIL_PASS;
export const OTP_EXPIRE = Number(process.env.OTP_EXPIRE);
export const CLIENT_ID = process.env.CLIENT_ID;
export const CLOUD_NAME = process.env.CLOUD_NAME;
export const API_KEY = process.env.API_KEY;
export const API_SECRET = process.env.API_SECRET;
export const REDIS_URL = process.env.REDIS_URL;
