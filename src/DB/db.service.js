//~ Assignment 13 ~//

export const create = async ({ model, data } = {}) => {
  return await model.create(data);
};

export const findOne = async ({ model, filter = {}, options } = {}) => {
  let doc = model.findOne(filter);
  if (doc) {
    if (options) {
      if (options.populate) {
        doc = doc.populate(options.populate);
      }
      if (options.skip) {
        doc = doc.skip(options.skip);
      }
      if (options.limit) {
        doc = doc.limit(options.limit);
      }
      if (options.select) {
        doc = doc.select(options.select);
      }
      return await doc.exec();
    }
    return await doc;
  }
  return doc;
};

export const find = async ({ model, filter = {}, options } = {}) => {
  const doc = await model.find(filter);
  if (doc) {
    if (options) {
      if (options.populate) {
        doc = doc.populate(options.populate);
      }
      if (options.skip) {
        doc = doc.skip(options.skip);
      }
      if (options.limit) {
        doc = doc.limit(options.limit);
      }
      if (options.sort) {
        doc = doc.sort(options.sort);
      }
      if (options.select) {
        doc = doc.select(options.select);
      }
      return await doc.exec();
    }
    return await doc;
  }
  return doc;
};

export const updateOne = async ({
  model,
  filter = {},
  updates = {},
  options = {},
} = {}) => {
  const doc = await model.updateOne(filter, updates, {
    runValidators: true,
    ...options,
  });
  return doc;
};

export const findOneAndUpdate = async ({
  model,
  filter = {},
  updates = {},
  options = {},
} = {}) => {
  const doc = await model.findOneAndUpdate(filter, updates, {
    runValidators: true,
    new: true,
    ...options,
  });
  return doc;
};

export const deleteOne = ({ model, filter = {} } = {}) => {
  return model.deleteOne(filter);
};

export const deleteMany = ({ model, filter = {} } = {}) => {
  return model.deleteMany(filter);
};
