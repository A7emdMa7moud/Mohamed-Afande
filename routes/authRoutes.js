const express = require("express");
const Joi = require("joi");
const router = express.Router();
const validate = require("../middleware/validateMiddleware");
const { register, login } = require("../controllers/authController");

const registerSchema = Joi.object({
  email: Joi.string().email().required().trim(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("admin", "staff"),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().trim(),
  password: Joi.string().required(),
});

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

module.exports = router;
