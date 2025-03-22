import { useState, useCallback } from 'react';

/**
 * Custom hook for form field validation
 * Centralizes validation logic and state management for form controls
 * 
 * @param {Function} validationFn - Validation function
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation state and functions
 */
export const useValidation = (validationFn, rules) => {
  const [error, setError] = useState(null);
  
  const validate = useCallback((value) => {
    const validationError = validationFn(value, rules);
    setError(validationError);
    return !validationError;
  }, [validationFn, rules]);
  
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  return {
    error,
    validate,
    clearError,
    isValid: !error
  };
};