const authenticationService = require('../services/authService');
const { StreamChat } = require('stream-chat');


// const { STREAM_API_KEY, STREAM_API_SECRET } = process.env;
const client = StreamChat.getInstance(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET);



async function home(req, res) {
  res.status(200).json({ success: true, message: 'WELCOME ON BOARD WITH ENGR CODES FATHER' });
};




async function register(req, res) {
  try {
    // Register user in your system
    const { user, token } = await authenticationService.register(req.body);

    if (!user) {
      throw new Error('User registration failed');
    }

    const { id, first_name, last_name, email } = user;

    // Create user in Stream Chat
    await client.upsertUser({
      id: id.toString(),  // Ensure ID is a string
      name: `${first_name} ${last_name}`,
      email,
      role: 'user',
      created_at: new Date().toISOString(),
    });

    // Generate Stream Chat token
    const chatToken = client.createToken(id.toString());

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      user,
      token,
      chatToken,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}




async function login(req, res) {
  try {
    const result = await authenticationService.login(req.body);
    const { id, first_name, last_name, email } = result.user;

    // Generate Stream Chat token
    const chatToken = client.createToken(id.toString());

    res.status(200).json({ 
      success: true, 
      message: 'Login successful', 
      user: result.user, 
      token: result.token, 
      chatToken  // Send Stream Chat token to the frontend
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
};

// Get All Users
async function getAllUsers(req, res) {
  try {
    const users = await authenticationService.getAllUsers();
    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get User by ID
async function getUserById(req, res) {
  try {
    const user = await authenticationService.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update User
async function updateUser(req, res) {
  try {
    const updatedUser = await authenticationService.updateUser(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete User
async function deleteUser(req, res) {
  try {
    await authenticationService.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


async function verifyUserEmail(req, res){
  try {
    // Expected: req.body contains email and otp
    const result = await authenticationService.verifyUserEmail(req.body);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


async function sendOTP(req, res){
  try {
    // Expected: req.body contains email
    const result = await authenticationService.sendOTP(req.body.email);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

async function changePassword(req, res){
  try {
    // Assumes an auth middleware has set req.user.id
    // Expected: req.body contains oldPassword and newPassword
    const result = await authenticationService.changePassword(req.user.id, req.body);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

async function resetPassword (req, res){
  try {
    // Expected: req.body contains email, otp, and newPassword
    const result = await authenticationService.resetPassword(req.body);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

async function logout(req, res){
  try {
    const result = await authenticationService.logout();
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};




module.exports = {
  home,
  register,
  login,
  verifyUserEmail,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  sendOTP,
  resetPassword,
  logout,
  changePassword
}