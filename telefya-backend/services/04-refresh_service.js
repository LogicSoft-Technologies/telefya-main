const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const generateHash = require('../lib/hashGen');
const responseObject = require('../lib/responseObject');
const { logout } = require('./authService');
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const accessTokenExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';

async function validateRefreshToken(refreshToken) {
    try {
        
        const decoded = jwt.verify(refreshToken, refreshTokenSecret);
        const hashedToken = generateHash(refreshToken);
    
        // Check token exists in database
        const tokensInDB = await query(
            `SELECT users.role
             FROM refresh_tokens
             JOIN users 
             ON refresh_tokens.user_id = users.id
             WHERE users.user_id = ? AND refresh_tokens.token_hash = ? `,
            [decoded.user, hashedToken]
        );
      
        if (!tokensInDB.length) {
            throw new Error('Invalid refresh token');
        }
       
        return {user:decoded.user, role:tokensInDB?.[0]?.role, name: decoded.name };
    } catch (error) {
        console.error('Validation error:', error.message);
        throw error;
    }
}

const refresh_service = async (cookies) => {

    
    // Early return for missing token
    if (!cookies[process.env.COOKIE_NAME]) {
        return responseObject(false, true, {
            message: 'Refresh token not provided', 
            status: 401, 
            logout:true
        });
    }

    try {
        const userId = await validateRefreshToken(cookies[process.env.COOKIE_NAME]);
        
        // Generate new access token
        const newAccessToken = jwt.sign(
            userId ,
            accessTokenSecret,
            { expiresIn: accessTokenExpiresIn }
        );
       

        // Clean up old refresh tokens
        await query(
            'DELETE FROM refresh_tokens WHERE user_id = (SELECT id FROM users WHERE user_id = ?) AND expires_at < ?',
            [userId.user, new Date()]
        );
    
        const data = {
            accessToken: newAccessToken,
            message: 'Token refreshed successfully',
            id: userId.user,
            name: userId.name,
            status: 200,
            logout: false,
        }
      
        return responseObject(true, false, data );
    } catch (error) {
        console.error('Refresh error:', error);
        throw responseObject(false, true, 'Invalid or expired refresh token');
    }
};

module.exports = refresh_service;