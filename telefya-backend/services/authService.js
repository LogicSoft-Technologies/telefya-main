// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const dotenv = require('dotenv');
// const { query, db } = require('../config/db');
// // const sendEmailWithOTP = require('./sendEmail'); // Your email sending function
// const sendEmailWithOTP = require('./sendEmail'); // Import the email sender function

// // const db = require('../config/db'); // Adjust the path as needed

// dotenv.config();

// const SECRET_KEY = process.env.JWT_SECRET;
// const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// // Helper: sign a JWT token with the user id
// const signToken = (id) => {
//   return jwt.sign({ id }, SECRET_KEY, {
//     expiresIn: JWT_EXPIRES_IN,
//   });
// };

// // Helper: generate a random OTP (6-digit)
// const generateOTP = () => {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// };

// const authenticationService = {};

// // ===========================
// // REGISTER
// // ===========================
// // authenticationService.register = async (userData) => {
// //   try {
// //     // Destructure required fields from userData
// //     const { first_name, last_name, email, phone_number, password, location, date_of_birth } = userData;
    
// //     // (Optional) Validate input here if needed

// //     // Check if the email already exists
// //     const existing = await query('SELECT * FROM users WHERE email = ?', [email]);
// //     if (existing.length > 0) {
// //       throw new Error('Email already exists');
// //     }

// //     // Hash the password
// //     const hashedPassword = await bcrypt.hash(password, 12);

// //     // Generate an OTP for email verification
// //     const otp = generateOTP();

// //     // Insert the new user into the database
// //     const insertQuery = `INSERT INTO users 
// //       (first_name, last_name, email, phone_number, password, location, date_of_birth, is_verified, verification_otp)
// //       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`;
// //     const result = await query(insertQuery, [
// //       first_name,
// //       last_name,
// //       email,
// //       phone_number,
// //       hashedPassword,
// //       location || null,
// //       date_of_birth,
// //       otp
// //     ]);

// //     if (!result.insertId) {
// //       throw new Error('Failed to register user');
// //     }

// //     // Send the verification OTP via email
// //     await sendEmailWithOTP(email, otp);

// //     // Optionally, you can sign a token right away or wait for email verification
// //     const token = signToken(result.insertId);
// //     // return { id: result.insertId, token };
// //     return { 
// //       user: {
// //         id: result.insertId,
// //         first_name,
// //         last_name,
// //         email,
// //       }, 
// //       token 
// //     };
    
// //   } catch (error) {
// //     throw error;
// //   }
// // };

// authenticationService.register = async (userData) => {
//   try {
//     const { first_name, last_name, email, phone_number, password, location, date_of_birth } = userData;

//     const existing = await query('SELECT * FROM users WHERE email = ?', [email]);
//     if (existing.length > 0) {
//       throw new Error('Email already exists');
//     }

//     const hashedPassword = await bcrypt.hash(password, 12);
//     const otp = generateOTP();

//     const insertQuery = `INSERT INTO users 
//       (first_name, last_name, email, phone_number, password, location, date_of_birth, is_verified, verification_otp)
//       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`;
//     const result = await query(insertQuery, [
//       first_name,
//       last_name,
//       email,
//       phone_number,
//       hashedPassword,
//       location || null,
//       date_of_birth,
//       otp
//     ]);

//     if (!result.insertId) {
//       throw new Error('Failed to register user');
//     }

//     await sendEmailWithOTP(email, otp);

//     const token = signToken(result.insertId);

//     // Fetch the newly created user from the database
//     const [user] = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);

//     return { user, token };
//   } catch (error) {
//     throw error;
//   }
// };


// // ===========================
// // LOGIN
// // ===========================
// authenticationService.login = async (loginData) => {
//   try {
//     const { email, password } = loginData;
//     if (!email || !password) {
//       throw new Error('Email and password are required for login');
//     }

//     // Fetch user by email
//     const users = await query('SELECT * FROM users WHERE email = ?', [email]);
//     if (users.length === 0) {
//       throw new Error('User not found');
//     }
//     const user = users[0];

//     // Check if user is verified
//     if (!user.is_verified) {
//       throw new Error('Please verify your email before logging in');
//     }

//     // Compare password
//     const isValid = await bcrypt.compare(password, user.password);
//     if (!isValid) {
//       throw new Error('Invalid password');
//     }

//     // Generate token
//     const token = signToken(user.id);
//     return { user, token };
//   } catch (error) {
//     throw error;
//   }
// };

// // ===========================
// // VERIFY USER EMAIL
// // ===========================
// // Accepts an object: { email, otp }
// authenticationService.verifyUserEmail = async ({ email, otp }) => {
//   try {
//     // Find the user with the matching email and OTP
//     const users = await query('SELECT * FROM users WHERE email = ? AND verification_otp = ?', [email, otp]);
//     if (users.length === 0) {
//       throw new Error('Invalid OTP or email');
//     }

//     // Mark the user as verified and clear the verification OTP
//     await query('UPDATE users SET is_verified = 1, verification_otp = NULL WHERE email = ?', [email]);
//     return { message: 'Email verified successfully' };
//   } catch (error) {
//     throw error;
//   }
// };

// // ===========================
// // SEND OTP (for password reset)
// // ===========================
// authenticationService.sendOTP = async (email) => {
//   try {
//     // Ensure user exists
//     const users = await query('SELECT * FROM users WHERE email = ?', [email]);
//     if (users.length === 0) {
//       throw new Error('User not found');
//     }
//     const user = users[0];

//     // Generate OTP and store in a separate `otps` table (or update a column in users)
//     const otp = generateOTP();
//     const insertOtpQuery = 'INSERT INTO otps (user_id, otp, created_at) VALUES (?, ?, NOW())';
//     await query(insertOtpQuery, [user.id, otp]);

//     // Send OTP via email
//     await sendEmailWithOTP(email, otp);

//     return { message: 'OTP sent successfully' };
//   } catch (error) {
//     throw error;
//   }
// };

// // ===========================
// // CHANGE PASSWORD (requires authentication)
// // ===========================
// // Expects: userId, oldPassword, newPassword
// authenticationService.changePassword = async (userId, { oldPassword, newPassword }) => {
//   try {
//     // Fetch the user
//     const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
//     if (users.length === 0) {
//       throw new Error('User not found');
//     }
//     const user = users[0];

//     // Verify old password
//     const valid = await bcrypt.compare(oldPassword, user.password);
//     if (!valid) {
//       throw new Error('Incorrect old password');
//     }

//     // Hash the new password and update
//     const hashedPassword = await bcrypt.hash(newPassword, 12);
//     await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
//     return { message: 'Password changed successfully' };
//   } catch (error) {
//     throw error;
//   }
// };

// // ===========================
// // RESET PASSWORD (using OTP)
// // ===========================
// // Expects: { email, otp, newPassword }
// authenticationService.resetPassword = async ({ email, otp, newPassword }) => {
//   try {
//     // Verify the OTP from the `otps` table
//     const otpQuery = 'SELECT * FROM otps WHERE user_id = (SELECT id FROM users WHERE email = ?) AND otp = ? ORDER BY created_at DESC LIMIT 1';
//     const otpRecords = await query(otpQuery, [email, otp]);
//     if (otpRecords.length === 0) {
//       throw new Error('Invalid or expired OTP');
//     }

//     // Hash the new password
//     const hashedPassword = await bcrypt.hash(newPassword, 12);
//     // Update the user's password
//     const updateQuery = 'UPDATE users SET password = ? WHERE email = ?';
//     await query(updateQuery, [hashedPassword, email]);

//     // Optionally, delete the used OTP
//     const deleteOtpQuery = 'DELETE FROM otps WHERE id = ?';
//     await query(deleteOtpQuery, [otpRecords[0].id]);

//     return { message: 'Password reset successfully' };
//   } catch (error) {
//     throw error;
//   }
// };

// // ===========================
// // LOGOUT
// // ===========================
// // In a JWT scenario, logout is typically handled on the client side by deleting the token.
// // If you want to support token blacklisting, you could store invalidated tokens.
// authenticationService.logout = async () => {
//   // This example assumes the client simply discards the token.
//   return { message: 'Logged out successfully' };
// };

// module.exports = authenticationService;






const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { query, db } = require('../config/db');
const sendEmailWithOTP = require('./sendEmail');

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Function to sanitize user input to prevent XSS attacks
const sanitizeInput = (input) => {
  return input.replace(/[&<>'"/]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
    '/': '&#x2F;'
  })[char]);
};

// Helper: sign a JWT token with the user id
const signToken = (id) => {
  return jwt.sign({ id }, SECRET_KEY, {
    expiresIn: JWT_EXPIRES_IN,
  });
};

// Helper: generate a random OTP (6-digit)
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const authenticationService = {};

// ===========================
// REGISTER
// ===========================
authenticationService.register = async (userData) => {
  try {
    let { first_name, last_name, email, phone_number, password, location, date_of_birth } = userData;
    
    // Sanitize input
    first_name = sanitizeInput(first_name);
    last_name = sanitizeInput(last_name);
    email = sanitizeInput(email);
    phone_number = sanitizeInput(phone_number);
    location = location ? sanitizeInput(location) : null;

    const existing = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();

    const insertQuery = `INSERT INTO users 
      (first_name, last_name, email, phone_number, password, location, date_of_birth, is_verified, verification_otp)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`;
    const result = await query(insertQuery, [
      first_name,
      last_name,
      email,
      phone_number,
      hashedPassword,
      location,
      date_of_birth,
      otp
    ]);

    if (!result.insertId) {
      throw new Error('Failed to register user');
    }

    await sendEmailWithOTP(email, otp);

    const token = signToken(result.insertId);
    const [user] = await query('SELECT * FROM users WHERE id = ?', [result.insertId]);

    return { user, token };
  } catch (error) {
    throw error;
  }
};

// ===========================
// LOGIN
// ===========================
authenticationService.login = async (loginData) => {
  try {
    let { email, password } = loginData;
    
    // Sanitize input
    email = sanitizeInput(email);

    if (!email || !password) {
      throw new Error('Email and password are required for login');
    }

    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      throw new Error('User not found');
    }
    const user = users[0];

    if (!user.is_verified) {
      throw new Error('Please verify your email before logging in');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid password');
    }

    // Generate token
    

    const token = signToken(user.id);
    return { user, token };
  } catch (error) {
    throw error;
  }
};

// ===========================
// VERIFY USER EMAIL
// ===========================
authenticationService.verifyUserEmail = async ({ email, otp }) => {
  try {
    email = sanitizeInput(email);
    otp = sanitizeInput(otp);

    const users = await query('SELECT * FROM users WHERE email = ? AND verification_otp = ?', [email, otp]);
    if (users.length === 0) {
      throw new Error('Invalid OTP or email');
    }

    await query('UPDATE users SET is_verified = 1, verification_otp = NULL WHERE email = ?', [email]);
    return { message: 'Email verified successfully' };
  } catch (error) {
    throw error;
  }
};


// ===========================
// VIEW ALL USERS
// ===========================
authenticationService.getAllUsers = async () => {
  try {
    const users = await query('SELECT id, first_name, last_name, email, phone_number, location, date_of_birth, is_verified FROM users');
    return users;
  } catch (error) {
    throw error;
  }
};

// ===========================
// VIEW USER DETAILS
// ===========================
authenticationService.getUserById = async (userId) => {
  try {
    const users = await query('SELECT id, first_name, last_name, email, phone_number, location, date_of_birth, is_verified FROM users WHERE id = ?', [userId]);
    if (users.length === 0) throw new Error('User not found');
    return users[0];
  } catch (error) {
    throw error;
  }
};

// ===========================
// UPDATE USER DETAILS
// ===========================
// authenticationService.updateUser = async (userId, updateData) => {
//   try {
//     const { first_name, last_name, phone_number, location, date_of_birth } = updateData;
//     const updatedFields = [];

//     if (first_name) updatedFields.push(`first_name = '${sanitizeInput(first_name)}'`);
//     if (last_name) updatedFields.push(`last_name = '${sanitizeInput(last_name)}'`);
//     if (phone_number) updatedFields.push(`phone_number = '${sanitizeInput(phone_number)}'`);
//     if (location) updatedFields.push(`location = '${sanitizeInput(location)}'`);
//     if (date_of_birth) updatedFields.push(`date_of_birth = '${sanitizeInput(date_of_birth)}'`);

//     if (updatedFields.length === 0) throw new Error('No updates provided');

//     const updateQuery = `UPDATE users SET ${updatedFields.join(', ')} WHERE id = ?`;
//     const result = await query(updateQuery, [userId]);

//     if (result.affectedRows === 0) throw new Error('User not found');
//     return { message: 'User updated successfully', };
//   } catch (error) {
//     throw error;
//   }
// };
authenticationService.updateUser = async (userId, updateData) => {
  try {
    // Fetch the existing user
    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      throw new Error('User not found');
    }

    // Extract updatable fields
    const { first_name, last_name, phone_number, location, date_of_birth } = updateData;

    // Perform the update
    const updateQuery = `
      UPDATE users 
      SET first_name = ?, last_name = ?, phone_number = ?, location = ?, date_of_birth = ? 
      WHERE id = ?`;
      
    const result = await query(updateQuery, [
      first_name || users[0].first_name,
      last_name || users[0].last_name,
      phone_number || users[0].phone_number,
      location || users[0].location,
      date_of_birth || users[0].date_of_birth,
      userId
    ]);

    if (result.affectedRows === 0) {
      throw new Error('User update failed');
    }

    // Fetch the updated user details
    const [updatedUser] = await query('SELECT * FROM users WHERE id = ?', [userId]);

    return { user: updatedUser, message: 'User updated successfully' };
  } catch (error) {
    throw error;
  }
};


// ===========================
// DELETE USER
// ===========================
authenticationService.deleteUser = async (userId) => {
  try {
    const result = await query('DELETE FROM users WHERE id = ?', [userId]);
    if (result.affectedRows === 0) throw new Error('User not found');
    return { message: 'User deleted successfully' };
  } catch (error) {
    throw error;
  }
};




authenticationService.sendOTP = async (email) => {
  try {
    // Ensure user exists
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      throw new Error('User not found');
    }
    const user = users[0];

    // Check for an existing OTP that was sent recently
    const existingOtpQuery = 'SELECT * FROM otps WHERE user_id = ? ORDER BY created_at DESC LIMIT 1';
    const existingOtps = await query(existingOtpQuery, [user.id]);

    if (existingOtps.length > 0) {
      const lastOtp = existingOtps[0];
      const otpCreatedAt = new Date(lastOtp.created_at);
      const currentTime = new Date();
      const timeDiff = (currentTime - otpCreatedAt) / 1000; // Convert to seconds

      if (timeDiff < 60) {
        throw new Error('Please wait 60 seconds. Check your email for the latest OTP.');

      }
    }

    // Generate a new OTP
    const otp = generateOTP();

    // Insert new OTP into the database
    const insertOtpQuery = 'INSERT INTO otps (user_id, otp, created_at) VALUES (?, ?, NOW())';
    await query(insertOtpQuery, [user.id, otp]);

    // Send OTP via email
    await sendEmailWithOTP(email, otp);

    return { message: 'OTP sent successfully' };
  } catch (error) {
    throw error;
  }
};



// ===========================
// CHANGE PASSWORD (requires authentication)
// ===========================
// Expects: userId, oldPassword, newPassword
authenticationService.changePassword = async (userId, { oldPassword, newPassword }) => {
  try {
    // Fetch the user
    const users = await query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      throw new Error('User not found');
    }
    const user = users[0];

    // Verify old password
    const valid = await bcrypt.compare(oldPassword, user.password);
    if (!valid) {
      throw new Error('Incorrect old password');
    }

    // Hash the new password and update
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
    return { message: 'Password changed successfully' };
  } catch (error) {
    throw error;
  }
};

// ===========================
// RESET PASSWORD (using OTP)
// ===========================
// Expects: { email, otp, newPassword }
authenticationService.resetPassword = async ({ email, otp, newPassword }) => {
  try {
    // Verify the OTP from the `otps` table
    const otpQuery = 'SELECT * FROM otps WHERE user_id = (SELECT id FROM users WHERE email = ?) AND otp = ? ORDER BY created_at DESC LIMIT 1';
    const otpRecords = await query(otpQuery, [email, otp]);
    if (otpRecords.length === 0) {
      throw new Error('Invalid or expired OTP');
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    // Update the user's password
    const updateQuery = 'UPDATE users SET password = ? WHERE email = ?';
    await query(updateQuery, [hashedPassword, email]);

    // Optionally, delete the used OTP
    const deleteOtpQuery = 'DELETE FROM otps WHERE id = ?';
    await query(deleteOtpQuery, [otpRecords[0].id]);

    return { message: 'Password reset successfully' };
  } catch (error) {
    throw error;
  }
};

// ===========================
// LOGOUT
// ===========================
// In a JWT scenario, logout is typically handled on the client side by deleting the token.
// If you want to support token blacklisting, you could store invalidated tokens.
authenticationService.logout = async () => {
  // This example assumes the client simply discards the token.
  return { message: 'Logged out successfully' };
};

module.exports = authenticationService;
