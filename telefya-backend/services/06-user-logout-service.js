
const user_logout_service = async (userId, {query, responseObject}) => {
    try {
        // Delete all refresh tokens for the user
       
        await query('DELETE FROM refresh_tokens WHERE user_id = (SELECT id FROM users WHERE user_id = ?)', [userId]);

        return responseObject(true, false, { message: 'User logged out successfully.', status: 200 });
    } catch (error) {
        console.error('Service error:', error);
        throw responseObject(false, true, { message: error.message || 'Internal server error.', status: 500 });
    }
    
}


module.exports = user_logout_service;