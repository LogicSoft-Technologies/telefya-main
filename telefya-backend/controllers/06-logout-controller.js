
const { query } = require('../config/db');
const responseObject = require('../lib/responseObject');
const user_logout_service = require('../services/06-user-logout-service');
const dotenv = require('dotenv');
dotenv.config();

const user_logout_controller = async (req, res) => {
    try {
        const { user } = req.user;
        const result = await user_logout_service(user.user, {
            query,
            responseObject,
        });

        if (result.error) {
            return res.status(result.status).json(result);
        }

        res.clearCookie(process.env.COOKIE_NAME, {
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        path: '/',
        domain: process.env.COOKIE_DOMAIN 
        });
   
        return res.status(200).json(result);
    } catch (error) {
       // console.log(error, user_logout_service)
        return res.status(500).json({
            error: true,
            message: 'Internal server error '+ error.message,
            status: 500,
        });
    }
}


module.exports = user_logout_controller;