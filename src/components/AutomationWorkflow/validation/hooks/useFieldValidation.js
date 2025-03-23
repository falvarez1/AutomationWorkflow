import { useState, useCallback, useEffect, useRef } from 'react';
import { validationRuleRegistry } from '../ValidationRuleRegistry';

/**
 * Field Validation Hook
 * 
 * Custom hook for single field validation
 * 
 * @param {any} initialValue - Initial field value
 * @param {Object} validationRules - Rules to validate against
 * @param {Object} options - Additional options
 * @returns {Object} Field state and methods
 */
export const useFieldValidation = (
  initialValue, 
  validationRules = {}, 
  options = {}
) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    validateOnMount = false,
    onValidate,
    debounceMs = 300
  } = options;
  
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const [isTouched, setIsTouched] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  
  // Store the timeout reference
  const debounceTimeoutRef = useRef(null);
  
  // Store the most recent validation rules to avoid unnecessary validation
  const rulesRef = useRef(validationRules);
  
  // Update rules ref when rules change
  useEffect(() => {
    rulesRef.current = validationRules;
  }, [validationRules]);
  
  // Validate the field value
  const validate = useCallback((valueToValidate = value) => {
    setIsValidating(true);
    
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Function to perform validation
    const performValidation = () => {
      let fieldError = null;
      
      // Apply each validation rule
      for (const [ruleType, params] of Object.entries(rulesRef.current)) {
        // Skip dependency rules - they can't be validated in isolation
        if (ruleType === 'dependency' || ruleType === 'dependencies' || 
            ruleType === 'conditionalRequired') {
          continue;
        }
        
        const rule = validationRuleRegistry.getRule(ruleType);
        if (rule) {
          fieldError = rule.validate(valueToValidate, params);
          if (fieldError) break;
        }
      }
      
      setError(fieldError);
      setIsValidating(false);
      
      // Call onValidate callback if provided
      if (onValidate) {
        onValidate(fieldError === null, fieldError);
      }
      
      return fieldError === null;
    };
    
    // Debounce validation to avoid excessive processing
    if (debounceMs > 0) {
      debounceTimeoutRef.current = setTimeout(performValidation, debounceMs);
      return true; // Return optimistic result
    } else {
      return performValidation();
    }
  }, [value, debounceMs, onValidate]);
  
  // Handle value change
  const handleChange = useCallback((newValue) => {
    setValue(newValue);
    
    if (validateOnChange && isTouched) {
      validate(newValue);
    }
  }, [validate, validateOnChange, isTouched]);
  
  // Handle blur event
  const handleBlur = useCallback(() => {
    if (!isTouched) {
      setIsTouched(true);
    }
    
    if (validateOnBlur) {
      validate();
    }
  }, [validate, validateOnBlur, isTouched]);
  
  // Reset the field
  const reset = useCallback((newValue = initialValue) => {
    setValue(newValue);
    setError(null);
    setIsTouched(false);
    
    // Clear any pending validation
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  }, [initialValue]);
  
  // Validate on mount if specified
  useEffect(() => {
    if (validateOnMount) {
      validate();
    }
    
    return () => {
      // Clean up any pending validation on unmount
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [validateOnMount, validate]);
  
  return {
    value,
    error,
    isTouched,
    isValidating,
    isValid: error === null,
    isDirty: value !== initialValue,
    handleChange,
    handleBlur,
    validate,
    reset,
    
    // Prop getters for input elements
    getInputProps: () => ({
      value,
      onChange: (e) => handleChange(e.target.value),
      onBlur: handleBlur
    }),
    
    // Prop getters for checkbox elements
    getCheckboxProps: () => ({
      checked: !!value,
      onChange: (e) => handleChange(e.target.checked),
      onBlur: handleBlur
    })
  };
};