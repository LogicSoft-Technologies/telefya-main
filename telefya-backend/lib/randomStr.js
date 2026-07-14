/**
 * Generates a random string with specified length and character set options.
 * 
 * @param {number} length - The length of the generated random string.
 * @param {boolean} [includeSpecialChar=false] - If true, the string will include special characters (`@$&#*!%`). Defaults to false.
 * @param {boolean} [randomLength=false] - If true, the length of the string will be randomly generated within the range of the provided `length`. Defaults to false.
 * @param {boolean} [numberOnly=false] - If true, the string will only include numeric characters (`0123456789`). Defaults to false.
 * 
 * @returns {string} - A randomly generated string based on the specified options.
 * 
 * @example
 * // Generate a 10-character random string with letters and numbers (no special characters)
 * randomStr(10);
 * 
 * @example
 * // Generate a random string with random length (between 10 and 20 characters), including special characters
 * randomStr(10, true, true);
 * 
 * @example
 * // Generate a 6-character random string with numbers only
 * randomStr(6, false, false, true);
 */
const randomStr = (
    length,  
    numberOnly = false,
    includeSpecialChar = false,
    randomLength = false,
  ) => {
    // If randomLength is true, generate a random length for the string
    length = randomLength ? Math.floor(Math.random() * length + length) : length;
  
    // Initialize the result string
    let result = "";
  
    // Define the special characters that can be included
    const specialChars = "@$&#*!%";
  
    // Define the set of characters to choose from
    const characters = numberOnly
      ? "0123456789" // If numberOnly is true, only use numbers
      : `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789${includeSpecialChar ? specialChars : ""}`; // Otherwise, use letters and possibly special chars
  
    const charactersLength = characters.length; // Get the length of the character set
  
    // Generate the random string by picking characters randomly from the character set
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
  
    // Return the generated random string
    return result;
  };
  
  // Export the function for use in other files
  module.exports = { randomStr };
  