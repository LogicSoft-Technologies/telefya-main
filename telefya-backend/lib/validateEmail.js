const validateEmail = (email) => {
    // Regular expression for email validation
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
    // Test the email against the regex
    if (!regex.test(email)) return false;
  
    // If the email is valid, return true (or any success message)
    return true;
  };


  module.exports = validateEmail; // Export the function for use in other modules