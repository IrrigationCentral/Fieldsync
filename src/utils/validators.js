// FieldSync v2 - Validation Utilities

/** @param {string} email */
export const validateEmail = (email) => {
  if (!email) return { valid: false, error: 'Email is required' };
  if (!/\S+@\S+\.\S+/.test(email)) return { valid: false, error: 'Invalid email format' };
  return { valid: true, error: '' };
};

/** @param {string} password */
export const validatePassword = (password) => {
  if (!password) return { valid: false, error: 'Password is required' };
  if (password.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
  return { valid: true, error: '' };
};

/** @param {string} password @param {string} confirm */
export const validatePasswordMatch = (password, confirm) => {
  if (password !== confirm) return { valid: false, error: 'Passwords do not match' };
  return { valid: true, error: '' };
};

/** @param {string} phone */
export const validatePhone = (phone) => {
  if (!phone) return { valid: true, error: '' }; // phone is optional
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 10) return { valid: false, error: 'Phone must be at least 10 digits' };
  return { valid: true, error: '' };
};

/** @param {*} value @param {string} fieldName */
export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, error: `${fieldName} is required` };
  }
  return { valid: true, error: '' };
};
