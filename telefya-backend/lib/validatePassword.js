 const validatePassword = (password) => {
    // Regular expression for strong password policy
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  
    // Test the password against the regex
    if (!regex.test(password)) return false
  
    
  
    // If the password passes all checks, return true (or any success message)
    return true;
  };
  

  module.exports = validatePassword;