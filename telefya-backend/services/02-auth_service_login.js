const dotenv = require('dotenv');
dotenv.config();

const auth_service_login = async (data, dependencyObject) => {
  const {
    query,
    bcrypt,
    jwt,
    accessTokenSecret = process.env.ACCESS_TOKEN_SECRET,
    refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET,
    accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN,
    responseObject,
    generateHash,
    ip,
    userAgent,
    sanitizeInput,
    validateEmail,
    validatePassword,

  } = dependencyObject;

  let { email, password, cookies } = data;
  email = sanitizeInput(email);

  try {
   
    // 1. Validate input
    if (!email || !password) {
      return responseObject(false, true, {
        message: 'Email and password are required.',
        status: 400,
      });
    }

    if (!validateEmail(email)) {
      return responseObject(false, true, {
        message: 'Invalid email format.',
        status: 400,
      });
    }

    if(!validatePassword(password)) {
      return responseObject(false, true, {  
        message: 'Password policy violation',
        status: 400,
      });
    }



    
    // 2. Fetch user from database
    const foundUsers = await query(
      'SELECT id, email, user_id, password, first_name, last_name, role FROM users WHERE email = ?',
      [email]
    );
    const foundUser = foundUsers[0]; // Assuming single result

    if (!foundUser) {
      return responseObject(false, true, {
        message: 'Unauthorized: User not found.',
        status: 401,
      });
    }

    // 3. Verify password
    const match = await bcrypt.compare(password, foundUser.password);
    if (!match) {
      return responseObject(false, true, {
        message: 'Unauthorized: Incorrect password.',
        status: 401,
      });
    }
    
    /**
     * if access to is expired and jwt.verified is false,
     * then we check the user cookies for the refresh token
     * convert the cookie refresh token to to hash and compare it to hash saved the database
     * if it matches, then we generate a new access token
     * and a new refresh token hashed and save it to the database
     * and send it to the client as a cookie
     */
    // 4. Generate JWTs
    const accessToken = jwt.sign(
      {
          user: foundUser.user_id,
          name: foundUser.first_name+' '+foundUser.last_name,
          roles: foundUser.role,
      },
      accessTokenSecret,

      { expiresIn: accessTokenExpiresIn }
    );

    const newRefreshToken = jwt.sign(
      { 
        user: foundUser.user_id,
        name: foundUser.first_name+' '+foundUser.last_name,
        roles: foundUser.role
       },
      refreshTokenSecret,
      { expiresIn: refreshTokenExpiresIn }
    );


    // delete old refresh tokens from the database that has expired
      
  

    // 5. Handle existing refresh tokens that has not expired
    const savedRefreshTokenInDB = await query(
      'SELECT * FROM refresh_tokens WHERE user_id = ? ORDER BY created_at DESC',
      [foundUser.id]
    );
   


    let existingRefeshTokens = savedRefreshTokenInDB || []; //in database ro no existing tokens
  
    // Filter out the current refresh token from cookies if it exists
   
    let refreshTokenSentToClient = cookies[process.env.COOKIE_NAME]
      ? existingRefeshTokens.filter((rt) => rt?.token_hash === generateHash(cookies[process.env.COOKIE_NAME]))
      : existingRefeshTokens;
    
      //
      
  
    // If no tokens are found in the database, clear all tokens, that token was stolen
    if (!savedRefreshTokenInDB || savedRefreshTokenInDB?.length === 0) {
      refreshTokenSentToClient = [];
    }
    
 
    let updatedTokens = newRefreshToken;
 

     const expiration = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    // Add the new refresh token to the array
  
    // Set expiration for the session
  
    // Insert or update the session in the database ON DUPLICATE KEY useer_id must be UNIQUE
    const insertQuery = `
    INSERT INTO refresh_tokens (token_hash, user_id, expires_at, ip_address, user_agent)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE token_hash = ?, expires_at = ?, ip_address = ?, user_agent = ?`;
   
  const result = await query(insertQuery, [
    generateHash(updatedTokens),  // token_hash
    foundUser.id,                 // user_id
    expiration,                   // expires_at
    ip,                           // ip
    userAgent,                    // user_agent
    generateHash(updatedTokens),// token_hash for update
    expiration,                   // expires_at for update
    ip,                           // ip for update
    userAgent                     // user_agent for update
  ]);
  


    if (!result?.affectedRows) {
      return responseObject(false, true, {
        message: 'User login failed.',
        status: 500,
      });
    }
    // 6. Delete old refresh tokens that have expired
   await query(
      `DELETE FROM refresh_tokens WHERE user_id = ? AND   expires_at < ? `,
      [foundUser.id, new Date()]
    );
    
   //
    // 7. Return success response with tokens and cookie instructions
    return responseObject(true, false, {
      message: 'User logged in successfully.',
      status: 200,
      accessToken,
      id: foundUser.user_id,
      name: foundUser.first_name+' '+foundUser.last_name,
   
      cookie: {
        name: process.env.COOKIE_NAME,
        value: newRefreshToken,
        options: {
          domain: process.env.COOKIE_DOMAIN,
          path: '/',
          httpOnly: true,
          secure: true,//process.env.NODE_ENV === 'production',
          sameSite: 'Strict',  // the cookie only persist for cross-site requests if this is None
          maxAge: 7 * 24 * 60 * 60 * 1000, //seven day
          
        },
      },
    });

  
  } catch (error) {
    console.error('Login service error:', error);
    throw responseObject(false, true, {
      message: 'Login failed. Please try again.',
      status: 500,
    });
  }
};

module.exports = auth_service_login;