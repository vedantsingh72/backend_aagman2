/**
 * Codeword Utility Functions
 * Handles codeword validation for restricted role registrations
 */

/**
 * Validate codeword against environment variable
 * @param {string} providedCodeword - Codeword provided by user
 * @returns {boolean} True if codeword is valid
 */
export const validateCodeword = (providedCodeword) => {
  const expectedCodeword = process.env.CODEWORD;
  
  // If no codeword is set in environment, reject (security by default)
  if (!expectedCodeword) {
    return false;
  }
  
  // Compare codewords securely (constant-time comparison)
  if (!providedCodeword || typeof providedCodeword !== 'string') {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  return constantTimeCompare(providedCodeword.trim(), expectedCodeword.trim());
};

/**
 * Constant-time string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings are equal
 */
const constantTimeCompare = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

/**
 * Log failed codeword attempt securely
 * @param {string} email - Email of the attempt
 * @param {string} role - Role being registered
 */
export const logFailedAttempt = (email, role) => {
  // Log without exposing the codeword
  console.warn(`[SECURITY] Failed codeword attempt - Role: ${role}, Email: ${email}, Time: ${new Date().toISOString()}`);
  // In production, you might want to send this to a security monitoring service
};

