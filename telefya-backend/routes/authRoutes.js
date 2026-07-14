const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/home', authController.home);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/verify-email', authController.verifyUserEmail);
router.post('/send-otp', authController.sendOTP);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authController.logout);


// User Management
router.get('/users/viewAll', authController.getAllUsers); // Get all users
router.get('/users/view/:id', authController.getUserById); // Get user by ID
router.put('/users/update/:id', authController.updateUser); // Update user
router.delete('/users/delete/:id', authController.deleteUser); // Delete user

// Protected route: change password requires valid JWT token
// router.post('/change-password', authMiddleware, authController.changePassword);
// Protected routes (Require Authentication)
router.post('/change-password', authMiddleware, authController.changePassword);
router.post('/logout', authMiddleware, authController.logout); // Protected Logout Route

module.exports = router;
