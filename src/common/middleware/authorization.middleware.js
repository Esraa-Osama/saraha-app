//~ Assignment 13 ~//

export const authorization = (roles = []) => {
  return async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new Error("you are not authorized", { cause: 401 });
    }
    next();
  };
};
