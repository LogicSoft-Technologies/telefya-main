// src/controllers/verify_email_controller.js
const Joi = require('joi');
const { query } = require('../config/db');
const sanitizeInput = require('../lib/sanitize');
const verifyUserEmail = require('../services/01-auth_verify_email');

const schema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().required(),
});

const verifyEmailController = async (req, res) => {
  try {
   
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: true,
        message: error.details[0].message,
        status: 400,
      });
    }

    const result = await verifyUserEmail(req.body, {
      query,
      sanitizeInput,
    });

    return res.status(result.error ? result.status : 200).json(result);
  } catch (error) {
   // console.error('Controller error:', error.message);
    return res.status(500).json({
      error: true,
      message: 'Internal server error',
      status: 500,
    });
  }
};

module.exports = verifyEmailController;