// lib/validation.js
/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitize string input - remove dangerous characters and trim
 */
export function sanitizeString(input, maxLength = 1000) {
  if (typeof input !== "string") return "";
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ""); // Remove potential XSS characters
}

/**
 * Sanitize search query to prevent regex injection
 */
export function sanitizeSearchQuery(query) {
  if (typeof query !== "string") return "";
  // Escape regex special characters
  return query
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .slice(0, 200); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 254;
}

/**
 * Validate username - alphanumeric, underscore, hyphen, 3-30 chars
 */
export function isValidUsername(username) {
  if (typeof username !== "string") return false;
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
}

/**
 * Validate password strength
 * - At least 8 characters
 * - Contains at least one letter and one number
 */
export function isValidPassword(password) {
  if (typeof password !== "string") return false;
  if (password.length < 8) return false;
  if (password.length > 128) return false;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return hasLetter && hasNumber;
}

/**
 * Validate ObjectId format
 */
export function isValidObjectId(id) {
  if (typeof id !== "string") return false;
  return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validate file type
 */
export function isValidFileType(file, allowedTypes = ["image", "video"]) {
  if (!file || !file.type) return false;
  return allowedTypes.some((type) => file.type.startsWith(`${type}/`));
}

/**
 * Validate file size (in bytes)
 */
export function isValidFileSize(file, maxSizeMB = 10) {
  if (!file || !file.size) return false;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Sanitize MongoDB query parameters
 */
export function sanitizeMongoQuery(query) {
  if (typeof query !== "object" || query === null) return {};
  const sanitized = {};
  for (const [key, value] of Object.entries(query)) {
    // Only allow safe keys (alphanumeric and underscore)
    if (/^[a-zA-Z0-9_]+$/.test(key)) {
      if (typeof value === "string") {
        sanitized[key] = sanitizeString(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized;
}

