const responseObject = require("../lib/responseObject");

const verifyUserEmail = async (userData, dependenciesObject ) => {
    let { email, otp } = userData;
    const { query, sanitizeInput } = dependenciesObject;
  try {
    email = sanitizeInput(email);
    otp = sanitizeInput(otp);

    const users = await query('SELECT * FROM users WHERE email = ? AND verification_otp = ?', [email, otp]);
    if (users.length === 0) {
      return responseObject(false, true, {
        message: 'Invalid OTP or email.',
        status: 400,
      });
    }

    await query('UPDATE users SET is_verified = 1, verification_otp = NULL WHERE email = ?', [email]);
    return responseObject(false, false, {
      message: 'Email verified successfully.',
      status: 200,
    });
  } catch (error) {
    
   throw responseObject(false, true, {
      message: 'Internal server error. ',
      status: 500,
    });
  }
};


module.exports = verifyUserEmail;