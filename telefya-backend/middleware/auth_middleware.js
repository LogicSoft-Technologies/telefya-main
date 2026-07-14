const jwt = require('jsonwebtoken');
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

async function validateToken(token) {
    try {
        const decoded = jwt.verify(token, accessTokenSecret);
        
    
        if (!decoded || !decoded.user) {
            throw new Error('Invalid token');
        }
        
        return decoded;
    } catch (error) {
        console.error('Validation error:', error.message);
        throw error;
    }
}

const auth_middleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: true,
            message: 'Authorization header missing or invalid'
        });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        const decoded = await validateToken(token);
        req.user = decoded;
        next();
    } catch (err) {
      //access token will be refreh every 10min before 15min expiration 
      //so it expire it means is not valid anymore
        console.error('Authentication error:', err.message);
        return res.status(403).json({
            error: true,
            message: 'Access denied: Invalid or expired token'
        });
    }
};

module.exports = auth_middleware;