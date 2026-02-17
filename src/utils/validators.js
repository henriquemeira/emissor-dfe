/**
 * Validates CNPJ format and check digit
 * @param {string} cnpj - CNPJ to validate
 * @returns {boolean} True if valid
 */
function isValidCNPJ(cnpj) {
  if (!cnpj) return false;
  
  // Remove non-digits
  cnpj = cnpj.replace(/\D/g, '');
  
  // Check if has 14 digits
  if (cnpj.length !== 14) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Validate check digits
  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  const digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  length = length + 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += numbers.charAt(length - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

/**
 * Validates if file is a valid PFX/P12 certificate
 * @param {Object} file - Multer file object
 * @returns {Object} Validation result
 */
function validateCertificateFile(file) {
  if (!file) {
    return {
      valid: false,
      error: 'No file provided',
    };
  }
  
  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size exceeds 5MB limit',
    };
  }
  
  // Check file extension
  const validExtensions = ['.pfx', '.p12'];
  const fileExtension = file.originalname.toLowerCase().slice(-4);
  if (!validExtensions.includes(fileExtension)) {
    return {
      valid: false,
      error: 'Invalid file type. Only .pfx and .p12 files are allowed',
    };
  }
  
  return { valid: true };
}

/**
 * Validates required fields in request body
 * @param {Object} body - Request body
 * @param {string[]} requiredFields - Array of required field names
 * @returns {Object} Validation result
 */
function validateRequiredFields(body, requiredFields) {
  const missing = [];
  
  for (const field of requiredFields) {
    if (!body[field]) {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(', ')}`,
      missing,
    };
  }
  
  return { valid: true };
}

module.exports = {
  isValidCNPJ,
  validateCertificateFile,
  validateRequiredFields,
};
