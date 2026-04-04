//~ Assignment 14 ~//

import { redisClient } from "./redis.db.js";

export const set = async ({ key, value, ttl } = {}) => {
  try {
    const data = typeof value === "string" ? value : JSON.stringify(value);
    return ttl
      ? await redisClient.set(key, data, { EX: ttl })
      : await redisClient.set(key, data);
  } catch (error) {
    console.log("error to set data in redis", error);
  }
};

export const update = async ({ key, value, ttl } = {}) => {
  try {
    return await set({ key, value, ttl });
  } catch (error) {
    console.log("error to update data in redis", error);
  }
};

export const get = async (key) => {
  try {
    try {
      return JSON.parse(await redisClient.get(key));
    } catch (error) {
      return await redisClient.get(key);
    }
  } catch (error) {
    console.log("error to get data from redis", error);
  }
};

export const exists = async (key) => {
  try {
    return await redisClient.exists(key);
  } catch (error) {
    console.log("error to check data exists in redis", error);
  }
};

export const ttl = async (key) => {
  try {
    return await redisClient.ttl(key);
  } catch (error) {
    console.log("error to get ttl from redis", error);
  }
};

export const expire = async ({ key, ttl } = {}) => {
  try {
    return await redisClient.expire(key, ttl);
  } catch (error) {
    console.log("error to set expire in redis", error);
  }
};

export const deleteKey = async (key) => {
  try {
    if (!key.length) {
      return 0;
    }
    return await redisClient.del(key);
  } catch (error) {
    console.log("error to delete data from redis", error);
  }
};

export const keys = async (pattern) => {
  try {
    return await redisClient.keys(`${pattern}*`);
  } catch (error) {
    console.log("error to get keys from redis", error);
  }
};

export const revokedKey = ({ userId, jti } = {}) => {
  return `revokeToken::${userId}::${jti}`;
};

export const getKey = (userId) => {
  return `revokeToken::${userId}::`;
};

export const getProfileKey = (userId) => {
  return `profile::${userId}`;
};

export const otpKey = (email) => {
  return `otp:${email}`;
};

export const maxOtpKey = (email) => {
  return `otp:${email}::max-tries`;
};

export const blockOtpKey = (email) => {
  return `otp:${email}::block`;
};

export const incr = async (key) => {
  try {
    return await redisClient.incr(key);
  } catch (error) {
    console.log("error to increment key in redis", error);
  }
};

export const banKey = (email) => {
  return `ban::${email}`;
};

export const maxPasswordTries = (email) => {
  return `max-password-tries::${email}`;
};
