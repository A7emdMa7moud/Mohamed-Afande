const rateLimit = require("express-rate-limit");
const { TOO_MANY_REQUESTS, TOO_MANY_LOGIN_ATTEMPTS } = require("../utils/messages");

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: TOO_MANY_REQUESTS,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    error: TOO_MANY_LOGIN_ATTEMPTS,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, authLimiter };
