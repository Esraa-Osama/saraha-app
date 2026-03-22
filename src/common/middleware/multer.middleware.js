//~ Assignment 13 ~//

import multer from "multer";
import fs from "node:fs";

export const multerHD = ({ customPath = "general", filesTypes = [] } = {}) => {
  const fullPath = `uploads/${customPath}`;
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, fullPath);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + "-" + file.originalname);
    },
  });

  function fileFilter(req, file, cb) {
    if (!filesTypes.includes(file.mimetype)) {
      cb(new Error("invalid file type"));
    }
    cb(null, true);
  }
  const upload = multer({ storage, fileFilter });
  return upload;
};

export const multerHost = (filesTypes = []) => {
  const storage = multer.diskStorage({});

  function fileFilter(req, file, cb) {
    if (!filesTypes.includes(file.mimetype)) {
      cb(new Error("invalid file type"));
    }
    cb(null, true);
  }
  const upload = multer({ storage, fileFilter });
  return upload;
};
