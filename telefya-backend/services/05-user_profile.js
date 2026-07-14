const fs = require('fs');
const path = require('path');

const get_profile_service =  async (userId, {query, responseObject}) => {
  try {
    const users = await query('SELECT user_id, first_name, profile_image, last_name, email, phone_number, country, state, city, date_of_birth, is_verified FROM users WHERE user_id = ?', [userId]);
    if (users.length === 0) throw responseObject(false, true, { message: 'User not found.', status: 404 });
    return responseObject(false, false, { message: 'User profile retrieved successfully.', status: 200, data: users[0] });
  } catch (error) {
    console.error('Service error:', error);
    throw responseObject(false, true, { message: error.message || 'Internal server error.', status: 500 });
  }
};

/**
 * @param {string} userId - The ID of the user.
 * @param {string} path - The path to the image file.
 * @param {object} options - Additional options. depending on the function
 */
const save_profile_image = async(user_id, path, {query,responseObject})=>{
  console.log("save_profile_image", user_id, path)
  try {
    if (!user_id || !path) throw responseObject(false, true, { message: 'User ID and image path are required.', status: 400 });
    const userExists = await query('SELECT user_id, profile_image  FROM users WHERE user_id = ?', [user_id]);
    if (userExists.length === 0) throw responseObject(false, true, { message: 'User not found.', status: 404 });
    if (userExists[0].profile_image) {
      // Optionally delete the old image file if needed
      if (userExists[0].profile_image !== path) {
         if (fs.existsSync(userExists[0].profile_image)) {
         fs.unlinkSync(userExists[0].profile_image);
         }
      }
    
    }
    // Update the user's profile image path in the database
    const result = await query('UPDATE users SET profile_image = ? WHERE user_id = ?', [path, user_id]);
    if (result.affectedRows === 0) throw responseObject(false, true, { message: 'Failed to update profile image.', status: 500 });
    return responseObject(true, false, { message: 'Profile image updated successfully.', status: 200 });
  } catch (error) {
    console.error('Service error:', error);
    throw responseObject(false, true, { message: error.message || 'Internal server error.', status: 500 });
  }
  
}

module.exports = {get_profile_service, save_profile_image};   