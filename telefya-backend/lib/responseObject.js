/**
 * Response template
 * @param success {boolean}
 * @param error {boolean}
 * @param message {string | object}
 * @returns object {success: true|false, error: true|false, message: }
 */
 const responseObject = (
  success,
  error,
  message,
) => {
  // If the message is a string, convert it to an object with a 'message' property
  const responseMessage = typeof message === "string" ? { message } : message;

  // Return the response object with success, error, and message properties
  return { success, error, ...responseMessage };
};

module.exports = responseObject;