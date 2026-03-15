//~ Assignment 12 ~//

import { verifyToken } from "../services/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { Types } from "mongoose";
import {
  JWT_ACCESS_SECRET_KEY,
  PREFIX,
} from "../../../config/config.service.js";
import { get, revokedKey } from "../../DB/redis/redis.service.js";

export const authentication = async (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    throw new Error("token required, please login", { cause: 401 });
  }
  const [prefix, token] = authorization.split(" ");
  if (prefix !== PREFIX) {
    throw new Error("invalid prefix", { cause: 401 });
  }

  const decoded = verifyToken({
    token,
    secret_key: JWT_ACCESS_SECRET_KEY,
  });
  if (!decoded || !decoded?.id) {
    throw new Error("invalid token", { cause: 401 });
  }

  const user = await db_service.findOne({
    model: userModel,
    filter: { _id: new Types.ObjectId(decoded.id) },
  });
  if (!user) {
    throw new Error("user not found", { cause: 404 });
  }

  if (user?.changeCredential?.getTime() > decoded.iat * 1000) {
    throw new Error("invalid token", { cause: 404 });
  }

  let revokeToken = await get(
    revokedKey({ userId: user._id, jti: decoded.jti }),
  );
  if (revokeToken) {
    throw new Error("token is already revoked", { cause: 404 });
  }

  req.user = user;
  req.decoded = decoded;
  next();
};
