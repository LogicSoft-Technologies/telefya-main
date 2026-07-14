const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Attach the decoded user to the request
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
};

module.exports = authMiddleware;




// const jwt = require('jsonwebtoken');

// const authMiddleware = (req, res, next) => {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//         return res.status(401).json({ success: false, message: 'No token provided' });
//     }

//     const token = authHeader.split(' ')[1];

//     try {
//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         req.user = decoded;  // ✅ Attach user data to request
//         next();
//     } catch (error) {
//         return res.status(401).json({ success: false, message: 'Invalid or expired token' });
//     }
// };

// module.exports = authMiddleware;



// const jwt = require('jsonwebtoken');
// const dotenv = require('dotenv');
// dotenv.config();

// const SECRET_KEY = process.env.JWT_SECRET;

// module.exports = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader)
//     return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

//   const token = authHeader.replace('Bearer ', '');
//   try {
//     const decoded = jwt.verify(token, SECRET_KEY);
//     req.user = decoded; // decoded contains at least { id }
//     next();
//   } catch (error) {
//     res.status(400).json({ success: false, message: 'Invalid token' });
//   }
// };
