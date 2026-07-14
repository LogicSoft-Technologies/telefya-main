
const { query } = require('../config/db');
const sendEmailWithOTP = require('../services/sendEmail');
const { randomStr } = require('../lib/randomStr');
const { request_password_reset, reset_password } = require('../services/03-password_service');
const responseObject = require('../lib/responseObject');
const bcrypt = require('bcrypt');
const validatePassword = require('../lib/validatePassword');


const request_password_reset_controller = async (req, res) => {
  try {
  if (!req.body.email) {
       return res.status(400).json({
        error: true,
        message: 'Email is required',
        status: 400,
        });
    }

    const result = await request_password_reset(req.body.email, {
      query,
      sendEmailWithOTP,
      randomStr,
      responseObject,
    });

    return res.status(result.error ? result.status : 200).json(result);
  } catch (error) {
     return res.status(error.status || 500).json({
      error: true,
      message: error.message || 'Internal server error',
      status: error.status || 500,
    });
  }
};



const reset_password_controller = async (req, res) => {
    try {
    //  
     const {email, token:otp, password} = req.body;
      // Validate input
    if (!email || !otp || !password) {
       return  res.status(400).json(responseObject(false, true, {
          message: 'Email, OTP, and password are required',
          status: 400,
        }));
    }

  
      const result = await reset_password({email, otp, password}, {
        query,
        bcrypt,
        responseObject,
        validatePassword
      });
  
     return res.status(result.error ? result.status : 200).json(result);
    } catch (error) {
     // console.error('Controller error:', error);
      throw res.status(error.status || 500).json({
        error: true,
        message: error.message || 'Internal server error',
        status: error.status || 500,
      });
    }
  };
  
 

  module.exports = {
    request_password_reset_controller,
    reset_password_controller,
  };
