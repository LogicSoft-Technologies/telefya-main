const auth_service_login = require('../services/02-auth_service_login');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');


const authLoginController = async (req, res) => {
  
  try {
    const result = await auth_service_login(
      {
        email: req.body.email,
        password: req.body.password,
        cookies: req.cookies,
      },
      {
        query,
        bcrypt,
        jwt,
        ip:req.ip,
        userAgent: req.headers['user-agent'],
        sanitizeInput: require('../lib/sanitize'),
        validateEmail: require('../lib/validateEmail'),
        validatePassword: require('../lib/validatePassword'),
        generateHash: require('../lib/hashGen'),
        responseObject: require('../lib/responseObject')
      }
    );

    if (result.error) {
      return res.status(result.status).json(result);
    }

    // Set cookie if provided in response
    if (result.cookie) {
      res.cookie(
        result.cookie.name,
        result.cookie.value,
        result.cookie.options
      );
    }
    delete result.cookie; // Remove cookie from response object
    return res.status(200).json(result);
  } catch (error) {
   
    return res.status(500).json({
      error: true,
      message: 'Internal server error',
      status: 500,
    });
  }
};


//authGenerateBotTokenController - a function tthat send jwt webtoken to bot

const authGenerateBotTokenController = async (req, res) => {
  try {
    const payload = {
      user: require('crypto').randomBytes(16).toString('hex'), // You can set a specific identifier for the bot
      name: 'Record bot',
      roles: 'bot',
    };
 
    const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
   
    return res.status(200).json({
      success: true,
      message: 'Bot token generated successfully',
      accessToken: token,
      id: payload.user, // Generate a random ID for the bot
      name: payload.name,
      roles: payload.roles,

    });
  } catch (error) {
   
    return res.status(500).json({
      error: true,
      message: 'Internal server error' + error.message,
      status: 500,
    });
  }
};

module.exports = {
  authLoginController,
  authGenerateBotTokenController
};