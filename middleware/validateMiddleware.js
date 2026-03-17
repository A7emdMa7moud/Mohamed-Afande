const { VALIDATION_FAILED } = require("../utils/messages");

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        error: VALIDATION_FAILED,
        errors,
      });
    }
    next();
  };
};

module.exports = validate;
