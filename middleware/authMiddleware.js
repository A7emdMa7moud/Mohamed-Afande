const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  NOT_AUTHORIZED,
  USER_NOT_FOUND,
  TOKEN_INVALID,
  FORBIDDEN,
} = require("../utils/messages");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: NOT_AUTHORIZED,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        error: USER_NOT_FOUND,
      });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: TOKEN_INVALID,
    });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: FORBIDDEN,
      });
    }
    next();
  };
};

module.exports = { protect, restrictTo };
