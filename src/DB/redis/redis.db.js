//~ Assignment 14 ~//

import { createClient } from "redis";
import { REDIS_URL } from "../../../config/config.service.js";

export const redisClient = createClient({
  url: REDIS_URL,
});

export const redisConnection = async () => {
  try {
    await redisClient.connect();
    console.log("connected to redis successfully");
  } catch (error) {
    console.log("failed to connect to redis", error);
  }
};
