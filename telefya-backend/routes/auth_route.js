const express = require('express');
const authRegisterController = require('../controllers/01-auth_register_controller');
const authLoginController = require('../controllers/02-auth-login_controller');
const verifyEmailController = require('../controllers/01-auth_verify_email_controller');
const auth_resent_otp = require('../controllers/01-auth_resend_otp_controller');
const { request_password_reset_controller, reset_password_controller } = require('../controllers/03-password_controller');
const refresh_controller = require('../controllers/04-refresh_controller');
const auth_router = express.Router();


/**
 * req.body {
 *   first_name: string,
 *   last_name: string,
 *   email: string,
 *   phone_number: string,
 *   password: string,
 *   country: string,
 *   state: string,
 *   city: string,
 *   date_of_birth: string,
 *   country_code: string
 * }
 *
 * responses:
 * 201 {
 *   success: boolean,
 *   message: string,
 *   data: object,
 *   status: 201
 * }
 * 400 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 400
 * }
 * 500 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 500
 * }
 *
 * @swagger
 * /api/v2/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - phone_number
 *               - password
 *               - country
 *               - state
 *               - city
 *               - date_of_birth
 *               - country_code
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               phone_number:
 *                 type: string
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 example: yourpassword
 *               country:
 *                 type: string
 *                 example: USA
 *               state:
 *                 type: string
 *                 example: California
 *               city:
 *                 type: string
 *                 example: Los Angeles
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               country_code:
 *                 type: string
 *                 example: "+1"
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "12345"
 *                         email:
 *                           type: string
 *                           example: user@example.com
 *                 status:
 *                   type: integer
 *                   example: 201
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid input data
 *                 message:
 *                   type: string
 *                   example: Please provide valid user details
 *                 status:
 *                   type: integer
 *                   example: 400
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Internal server error
 *                 message:
 *                   type: string
 *                   example: An error occurred while registering the user
 *                 status:
 *                   type: integer
 *                   example: 500
 */

/**
 * req.body {
 *   email: string,
 *   password: string
 * }
 *
 * responses:
 * 200 {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     accessToken: string,
 *     user: object
 *   },
 *   cookie: {
 *     name: string,
 *     value: string,
 *     options: {
 *       domain: string,
 *       path: string,
 *       httpOnly: boolean,
 *       secure: boolean,
 *       sameSite: string,
 *       maxAge: number
 *     }
 *   },
 *   status: 200
 * }
 * 400 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 400
 * }
 * 500 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 500
 * }
 *
 * @swagger
 * /api/v2/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: yourpassword
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "jwt.token.here"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "12345"
 *                         email:
 *                           type: string
 *                           example: user@example.com
 *                 status:
 *                   type: integer
 *                   example: 200
 *         set-cookie:
 *           - name: refreshToken
 *             value: string
 *             description: Refresh token cookie
 *             options:
 *               domain: string
 *               path: string
 *               httpOnly: boolean
 *               secure: boolean
 *               sameSite: string
 *               maxAge: number
 *               example: refreshToken=abc123; Domain=example.com; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800000
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid credentials
 *                 message:
 *                   type: string
 *                   example: Please provide valid email and password
 *                 status:
 *                   type: integer
 *                   example: 400
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Internal server error
 *                 message:
 *                   type: string
 *                   example: An error occurred while logging in
 *                 status:
 *                   type: integer
 *                   example: 500
 */


/**
 * req.body {
 *   email: string,
 *   password: string
 * }
 *
 * responses:
 * 200 {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     accessToken: string,
 *     user: object
 *   },
 *   cookie: {
 *     name: string,
 *     value: string,
 *     options: {
 *       domain: string,
 *       path: string,
 *       httpOnly: boolean,
 *       secure: boolean,
 *       sameSite: string,
 *       maxAge: number
 *     }
 *   },
 *   status: 200
 * }
 * 400 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 400
 * }
 * 500 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 500
 * }
 *
 * @swagger
 * /api/v2/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: yourpassword
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "jwt.token.here"
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "12345"
 *                         email:
 *                           type: string
 *                           example: user@example.com
 *                 status:
 *                   type: integer
 *                   example: 200
 *         set-cookie:
 *           - name: refreshToken
 *             value: string
 *             description: Refresh token cookie
 *             options:
 *               domain: string
 *               path: string
 *               httpOnly: boolean
 *               secure: boolean
 *               sameSite: string
 *               maxAge: number
 *               example: refreshToken=abc123; Domain=example.com; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=604800000
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid credentials
 *                 message:
 *                   type: string
 *                   example: Please provide valid email and password
 *                 status:
 *                   type: integer
 *                   example: 400
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Internal server error
 *                 message:
 *                   type: string
 *                   example: An error occurred while logging in
 *                 status:
 *                   type: integer
 *                   example: 500
 */

/**
 * req.body {
 *   email: string,
 *   otp: string
 * }
 *
 * responses:
 * 200 {
 *   success: boolean,
 *   message: string,
 *   status: 200
 * }
 * 400 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 400
 * }
 * 500 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 500
 * }
 *
 * @swagger
 * /api/v2/auth/verify-email:
 *   post:
 *     summary: Verify user email with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Email verified successfully
 *                 status:
 *                   type: integer
 *                   example: 200
 *       400:
 *         description: Invalid OTP or email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid OTP or email
 *                 message:
 *                   type: string
 *                   example: Please provide a valid OTP and email
 *                 status:
 *                   type: integer
 *                   example: 400
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Internal server error
 *                 message:
 *                   type: string
 *                   example: An error occurred while verifying email
 *                 status:
 *                   type: integer
 *                   example: 500
 */

/**
 * req.body {
 *   email: string
 * }
 *
 * responses:
 * 200 {
 *   success: boolean,
 *   message: string,
 *   status: 200
 * }
 * 400 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 400
 * }
 * 500 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 500
 * }
 *
 * @swagger
 * /api/v2/auth/resend-otp:
 *   post:
 *     summary: Resend OTP for email verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: OTP resent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: OTP resent successfully
 *                 status:
 *                   type: integer
 *                   example: 200
 *       400:
 *         description: Invalid email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid email
 *                 message:
 *                   type: string
 *                   example: Please provide a valid email
 *                 status:
 *                   type: integer
 *                   example: 400
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Internal server error
 *                 message:
 *                   type: string
 *                   example: An error occurred while resending OTP
 *                 status:
 *                   type: integer
 *                   example: 500
 */


/**
 * req.body {
 *   email: string
 * }
 *
 * responses:
 * 200 {
 *   success: boolean,
 *   message: string,
 *   status: 200
 * }
 * 400 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 400
 * }
 * 500 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 500
 * }
 *
 * @swagger
 * /api/v2/auth/request-password-reset:
 *   post:
 *     summary: Request a password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Password reset request successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset link sent to your email
 *                 status:
 *                   type: integer
 *                   example: 200
 *       400:
 *         description: Invalid email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid email
 *                 message:
 *                   type: string
 *                   example: Please provide a valid email
 *                 status:
 *                   type: integer
 *                   example: 400
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Internal server error
 *                 message:
 *                   type: string
 *                   example: An error occurred while processing the password reset request
 *                 status:
 *                   type: integer
 *                   example: 500
 */



/**
 * req.body {
 *   email: string,
 *   token: string,
 *   password: string
 * }
 *
 * responses:
 * 200 {
 *   success: boolean,
 *   message: string,
 *   status: 200
 * }
 * 400 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 400
 * }
 * 500 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 500
 * }
 *
 * @swagger
 * /api/v2/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - token
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               token:
 *                 type: string
 *                 example: "abc123resetToken"
 *               password:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset successfully
 *                 status:
 *                   type: integer
 *                   example: 200
 *       400:
 *         description: Invalid email, token, or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Invalid email, token, or password
 *                 message:
 *                   type: string
 *                   example: Please provide a valid email, token, and password
 *                 status:
 *                   type: integer
 *                   example: 400
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Internal server error
 *                 message:
 *                   type: string
 *                   example: An error occurred while resetting the password
 *                 status:
 *                   type: integer
 *                   example: 500
 */


/**
 * headers {
 *   Authorization: Bearer <refresh_token>
 * }
 *
 * responses:
 * 200 {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     accessToken: string,
 *     refreshToken: string
 *   },
 *   status: 200
 * }
 * 401 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 401
 * }
 * 500 {
 *   success: boolean,
 *   error: string,
 *   message: string,
 *   status: 500
 * }
 *
 * @swagger
 * /api/v2/auth/refresh-token:
 *   get:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 accessToken:
 *                    type: string
 *                    example: "jwt.new.access.token"
 *                 status:
 *                   type: integer
 *                   example: 200
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 logout:
 *                   type: boolean
 *                   example: false; if the user is still logged in
 *                 error:
 *                   type: string
 *                   example: Unauthorized
 *                 message:
 *                   type: string
 *                   example: Invalid or expired refresh token
 *                 status:
 *                   type: integer
 *                   example: 401
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: Internal server error
 *                 message:
 *                   type: string
 *                   example: An error occurred while refreshing the token
 *                 status:
 *                   type: integer
 *                   example: 500
 */
auth_router.post('/register', authRegisterController);
auth_router.post('/login', authLoginController.authLoginController);
auth_router.post('/verify-email', verifyEmailController);
auth_router.post('/resend-otp', auth_resent_otp);
auth_router.post('/request-password-reset', request_password_reset_controller);
auth_router.post('/reset-password', reset_password_controller);
auth_router.get('/refresh-token', refresh_controller)
auth_router.get('/generate-bot-token', authLoginController.authGenerateBotTokenController);

module.exports = auth_router;