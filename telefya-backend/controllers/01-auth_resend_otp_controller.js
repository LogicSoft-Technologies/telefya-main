// src/controllers/verify_email_controller.js

const { query } = require('../config/db');
const { randomStr } = require('../lib/randomStr');
const sanitizeInput = require('../lib/sanitize');
const  auth_resend_otp_service = require('../services/01-resend_otp_service');
const sendEmailWithOTP = require('../services/sendEmail');


const verifyEmailController = async (req, res) => {
  try {
 
    const result = await  auth_resend_otp_service(req.body, {
      query,
      sanitizeInput,
      generateOTP:randomStr,
      sendEmailWithOTP
    });

    return res.status(result.error ? result.status : 200).json(result);
  } catch (error) {
    
    return res.status(500).json({
      error: true,
      message: 'Internal server error',
      status: 500,
    });
  }
};

module.exports = verifyEmailController;