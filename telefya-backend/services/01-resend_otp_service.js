const responseObject = require('../lib/responseObject');

const  auth_resend_otp_service = async (
  userData,
  {
    query,
    sanitizeInput,
    sendEmailWithOTP,
    generateOTP,
  }
) => {
  
  try {
    const { email } = userData;

    // 1. Validate required fields
    if ( !email ) {
      return responseObject(false, true, {
        message: 'Email is required.',
        status: 400,
      });
    }


    // 2. Sanitize input
    const sanitized = {
      email: sanitizeInput(email),
    };

    // 3. Check for existing user
    
    const existing = await query(
      'SELECT * FROM users WHERE email = ?',
      [sanitized.email]
    );

    if (existing.length === 0) {
      return responseObject(false, true, {
        message: 'Email does not exists.',
        status: 400,
      });
    }

    // 4. Create user
   
    const otp = generateOTP(6, true); // 6-digit alphanumeric OTP

    const updateQuery = ` UPDATE users SET is_verified = ?, verification_otp = ? WHERE email = ?`;

    const result = await query(updateQuery, [
        0,
        otp,
        sanitized.email,
    ]);

    if (result.affectedRows === 0) {
      return responseObject(false, true, {
        message: 'Failed to update OTP.',
        status: 500,
      });
    }

    // 5. Send OTP email
    await sendEmailWithOTP(sanitized.email, otp);

    return responseObject(true, false, {
      message: 'OTP sent successfully.',
      state: 200
    });
  } catch (error) {
  console.error('Error during registration:', error);
    
    throw responseObject(false, true, {
      message: 'Internal rrror sendinig OTP.',
      status: 500,
    });
  }
};

module.exports = auth_resend_otp_service;