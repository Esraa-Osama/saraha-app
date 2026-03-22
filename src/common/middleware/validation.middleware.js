//~ Assignment 13 ~//

export const validation = (schema) => {
  return (req, res, next) => {
    let errors = [];

    for (const key of Object.keys(schema)) {
      const { value, error } = schema[key].validate(req[key], {
        abortEarly: false,
      });

      if (error) {
        error.details.forEach((detail) => {
          errors.push({
            key,
            path: detail.path[0],
            message: detail.message,
          });
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: "validation error", errors });
    }
    next();
  };
};
