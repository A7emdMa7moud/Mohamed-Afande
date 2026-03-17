const {
  INVALID_ID,
  NOT_FOUND,
  SERVER_ERROR,
  VALIDATION_FAILED,
} = require("../utils/messages");

const errorHandler = (err, req, res, next) => {
  let statusCode =
    err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message || SERVER_ERROR;

  if (err.name === "CastError") {
    statusCode = 400;
    message = INVALID_ID;
  } else if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ") || VALIDATION_FAILED;
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({ success: false, error: NOT_FOUND });
};

module.exports = { errorHandler, notFound };
