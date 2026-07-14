const Joi = require("joi");
const sanitizeInput = require("../lib/sanitize");
const { query } = require("../config/db");
const sendEmailWithOTP = require("../services/sendEmail");
const { randomStr } = require("../lib/randomStr");
const validateEmail = require("../lib/validateEmail");
const validatePassword = require("../lib/validatePassword");
const auth_service_register = require("../services/01-auth_service_register");
const responseObject = require("../lib/responseObject");
const bcrypt = require("bcrypt");

const schema = Joi.object({
  first_name: Joi.string().trim().min(2).max(80).required(),
  last_name: Joi.string().trim().min(2).max(80).required(),
  email: Joi.string().trim().email().required(),
  phone_number: Joi.string().trim().min(5).max(30).required(),
  password: Joi.string().min(8).required(),
  country: Joi.string().trim().min(2).max(120).required(),
  state: Joi.string().trim().min(1).max(120).required(),
  city: Joi.string().trim().min(1).max(120).required(),
  date_of_birth: Joi.string().trim().required(),
  country_code: Joi.string()
    .trim()
    .pattern(/^\+\d{1,4}$/)
    .required()
    .messages({
      "string.pattern.base": "Country code must look like +234.",
    }),
});

const auth_resent_otp = async (req, res) => {
  try {
    const { error, value } = schema.validate(req.body, {
      abortEarly: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        status: 400,
        success: false,
      });
    }

    const result = await auth_service_register(value, {
      query,
      sanitizeInput,
      sendEmailWithOTP,
      generateOTP: randomStr,
      validateEmail,
      validatePassword,
      responseObject,
      bcrypt,
    });

    return res.status(result.error ? result.status : 200).json(result);
  } catch (error) {
    console.error("Registration controller error:", error);

    return res.status(error?.status || 500).json({
      error: true,
      success: false,
      message: error?.message || "Internal server error",
      status: error?.status || 500,
    });
  }
};

module.exports = auth_resent_otp;