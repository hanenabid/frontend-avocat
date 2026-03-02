import { useState, useCallback } from 'react';
import { validatePassword as validatePwdUtil, PASSWORD_POLICY_MESSAGE } from '../utils/password';

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => validatePwdUtil(password);

const validateRequired = (value) => {
  return value && value.toString().trim().length > 0;
};

const validatePhoneNumber = (phone) => {
  // Tunisia phone validation - must start with +216 followed by exactly 8 digits
  const tunisianPhoneRegex = /^\+216\d{8}$/;
  return tunisianPhoneRegex.test(phone.replace(/\s/g, ''));
};

// Validation messages
const VALIDATION_MESSAGES = {
  required: (field) => `${field} is required`,
  email: 'Please enter a valid email address',
  password: PASSWORD_POLICY_MESSAGE,
  passwordMatch: 'Passwords do not match',
  phone: 'Please enter a valid Tunisian phone number (+216 followed by 8 digits)',
  fileType: 'Only PDF, JPG, JPEG, and PNG files are allowed',
  fileSize: (maxSize) => `File size must be less than ${maxSize}MB`
};

export const useValidation = (overrides = {}) => {
  const [errors, setErrors] = useState({});

  // Clear specific error
  const clearError = useCallback((fieldName) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Set error for specific field
  const setError = useCallback((fieldName, message) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: message
    }));
  }, []);

  // Validate single field
  const validateField = useCallback((fieldName, value, rules = {}) => {
    const { required = false, type = 'text', minLength, maxLength, custom } = rules;
    
    // Required validation
    if (required && !validateRequired(value)) {
      const requiredMsg = overrides.required || VALIDATION_MESSAGES.required;
      const message = typeof requiredMsg === 'function' ? requiredMsg(fieldName) : requiredMsg;
      setError(fieldName, message);
      return false;
    }

    // Skip other validations if field is empty and not required
    if (!validateRequired(value)) {
      clearError(fieldName);
      return true;
    }

    // Type-specific validations
    switch (type) {
      case 'email':
        if (!validateEmail(value)) {
          const msg = overrides.email || VALIDATION_MESSAGES.email;
          setError(fieldName, msg);
          return false;
        }
        break;
      
      case 'password':
        if (!validatePassword(value)) {
          const msg = overrides.password || VALIDATION_MESSAGES.password;
          setError(fieldName, msg);
          return false;
        }
        break;
      
      case 'phone':
        if (!validatePhoneNumber(value)) {
          const msg = overrides.phone || VALIDATION_MESSAGES.phone;
          setError(fieldName, msg);
          return false;
        }
        break;
      
      default:
        break;
    }

    // Length validations
    if (minLength && value.length < minLength) {
      const tpl = overrides.minLength || ((f, n) => `${f} must be at least ${n} characters`);
      const message = typeof tpl === 'function' ? tpl(fieldName, minLength) : tpl;
      setError(fieldName, message);
      return false;
    }

    if (maxLength && value.length > maxLength) {
      const tpl = overrides.maxLength || ((f, n) => `${f} must be less than ${n} characters`);
      const message = typeof tpl === 'function' ? tpl(fieldName, maxLength) : tpl;
      setError(fieldName, message);
      return false;
    }

    // Custom validation
    if (custom && typeof custom === 'function') {
      const customResult = custom(value);
      if (customResult !== true) {
        setError(fieldName, customResult);
        return false;
      }
    }

    // Clear error if validation passed
    clearError(fieldName);
    return true;
  }, [setError, clearError, overrides]);

  // Validate multiple fields
  const validateFields = useCallback((formData, validationRules) => {
    let isValid = true;

    Object.keys(validationRules).forEach(fieldName => {
      const rules = validationRules[fieldName];
      const value = formData[fieldName];
      
      if (!validateField(fieldName, value, rules)) {
        isValid = false;
      }
    });

    return isValid;
  }, [validateField]);

  // Special validation for password confirmation
  const validatePasswordMatch = useCallback((password, confirmPassword) => {
    if (!validateRequired(confirmPassword)) {
      const requiredMsg = overrides.required || VALIDATION_MESSAGES.required;
      // Use the field key 'confirmPassword' so component-provided overrides can format a localized label
      const message = typeof requiredMsg === 'function' ? requiredMsg('confirmPassword') : requiredMsg;
      setError('confirmPassword', message);
      return false;
    }
    
    if (password !== confirmPassword) {
      const msg = overrides.passwordMatch || VALIDATION_MESSAGES.passwordMatch;
      setError('confirmPassword', msg);
      return false;
    }
    
    clearError('confirmPassword');
    return true;
  }, [setError, clearError, overrides]);

  // File validation
  const validateFile = useCallback((file, options = {}) => {
    const { maxSize = 10, allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'] } = options;
    
    if (!file) {
      const msg = overrides.fileRequired || 'File is required';
      return { isValid: false, error: msg };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
  const msg = overrides.fileType || VALIDATION_MESSAGES.fileType;
  return { isValid: false, error: msg };
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
  const tpl = overrides.fileSize || VALIDATION_MESSAGES.fileSize;
  const message = typeof tpl === 'function' ? tpl(maxSize) : tpl;
  return { isValid: false, error: message };
    }

    return { isValid: true, error: null };
  }, [overrides]);

  return {
    errors,
    setError,
    clearError,
    clearAllErrors,
    validateField,
    validateFields,
    validatePasswordMatch,
    validateFile,
    // Export validation functions for direct use
    validators: {
      validateEmail,
      validatePassword,
      validateRequired,
      validatePhoneNumber
    },
    messages: VALIDATION_MESSAGES
  };
};
