class ErrorResponse extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

const sendError = (res, message, statusCode = 500) => {
  res.status(statusCode).json({
    success: false,
    error: message || 'Server Error',
  });
};

module.exports = { ErrorResponse, sendError };
