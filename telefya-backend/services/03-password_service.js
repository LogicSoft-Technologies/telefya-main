
const request_password_reset = async (email, dependencyObject) => {

    const { query, sendEmailWithOTP, randomStr, responseObject } = dependencyObject;
   
 
    try {
   
    const users = await query('SELECT id, email FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return responseObject(false, true, {
        message: 'User not found',
        status: 404,
      });
    }
    const user = users[0];
    const otp = randomStr(6, true);
    await sendEmailWithOTP(user.email, otp);
    await query('INSERT INTO otps (otp, user) VALUES (?, ?)', [otp, user.id]); // Fixed query


    return responseObject(true, false, {
      message: 'Password request successful, OTP sent to your email',
      status: 200,
    });
  } catch (error) {
    
    throw responseObject(false, true, {
      message: 'Internal server error ' +error.message,
      status: 500,
    });
  }
};

const reset_password = async (data, dependenciesObject) => {
    const { email, otp, password } = data;
    const { query, bcrypt, responseObject, validatePassword } = dependenciesObject;
    try {
   
      if(validatePassword(password) === false){
        return responseObject(false, true, {
            message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
            status: 400,
        });
    }

    const otpQuery =
      'SELECT otp, user, id FROM otps WHERE user = (SELECT id FROM users WHERE email = ?) AND otp = ? ORDER BY created_at DESC LIMIT 1';
    const otpRecords = await query(otpQuery, [email, otp]);

 
    if (otpRecords.length === 0) {
      return responseObject(false, true, {
        message: 'Invalid OTP or email.',
        status: 400,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const updateQuery = 'UPDATE users SET password = ? WHERE email = ?';
    await query(updateQuery, [hashedPassword, email]);

    const deleteOtpQuery = 'DELETE FROM otps WHERE id = ?';
    await query(deleteOtpQuery, [otpRecords[0].id]);

    return responseObject(true, false, {
      message: 'Password reset successful.',
      status: 200,
    });
  } catch (error) {
    throw responseObject(false, true, {
      message: 'Internal server error',
      status: 500,
    });
  }
};

module.exports = {
  request_password_reset,
  reset_password,
};