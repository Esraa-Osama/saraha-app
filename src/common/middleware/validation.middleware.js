//~ Assignment 9 ~//

export const validation = (schema) => {
  return (req, res, next) => {
    const { value, error } = schema.validate(req.body, {
      abortEarly: false,
    });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      throw new Error(errors);
    }
    next();
  };
};
