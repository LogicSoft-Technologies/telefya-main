const crypto = require('crypto');

/**
 * Generates a SHA-256 hash of the given input string.
 * @param {string} input - The string to hash.
 * @returns {string} - The resulting hash in hexadecimal format.
 */
const  generateHash = (input) =>{
  return crypto.createHash('sha256').update(input).digest('hex');
}
module.exports = generateHash;  
