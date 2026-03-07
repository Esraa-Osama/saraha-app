//~ Assignment 11 ~//

import bcrypt from "bcrypt";
import { SALT_ROUNDS } from "../../../config/config.service.js";

export const applyHash = ({ originalText, saltRounds = SALT_ROUNDS } = {}) => {
  return bcrypt.hashSync(originalText, Number(saltRounds));
};

export const compareHash = ({ originalText, hashedText } = {}) => {
  return bcrypt.compareSync(originalText, hashedText);
};
