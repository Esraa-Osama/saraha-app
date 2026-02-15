//~ Assignment 9 ~//

import bcrypt from "bcrypt";

export const applyHash = ({ originalText, saltRounds = 12 } = {}) => {
  return bcrypt.hashSync(originalText, Number(saltRounds));
};

export const compareHash = ({ originalText, hashedText } = {}) => {
  return bcrypt.compareSync(originalText, hashedText);
};
