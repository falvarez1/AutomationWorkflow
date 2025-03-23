import { useState, useCallback, useEffect, useMemo } from 'react';
import { ValidationEngine } from '../ValidationEngine';

/**
 * Form Validation Hook
 * 
 * Custom hook for validating forms
 * 
 * @param {Array} schema - Form field schema
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules for each field
 * @param {Object} registry - Plugin registry
 * @returns {Object} Form state and methods
 */
export const useFormValidation = (
  schema, 
  initialValues = {}, 
  validationRules = {}, 
  registry
) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouchedFields] = useState({});
  const [isValid, setIsValid] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  
  // Use useMemo to avoid recreating the validation engine on each render
  const validationEngine = useMemo(() => new ValidationEngine(registry), [registry]);
  
  // Validate a single field
  const validateField = useCallback((fieldId, value) => {
    const fieldSchema = schema.find(field => field.id === fieldId);
    const fieldRules = validationRules[fieldId];
    
    if (fieldSchema && fieldRules) {
      const fieldError = validationEngine.validateProperty(
        fieldId, value, fieldRules, fieldSchema
      );
      
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        if (fieldError) {
          newErrors[fieldId] = fieldError;
        } else {
          delete newErrors[fieldId];
        }
        
        const isFormValid = Object.keys(newErrors).length === 0;
        setIsValid(isFormValid);
        
        return newErrors;
      });
      
      return !fieldError;
    }
    
    return true;
  }, [schema, validationRules, validationEngine]);
  
  // Validate the entire form
  const validateForm = useCallback(() => {
    const result = validationEngine.validateForm(schema, values, validationRules);
    setErrors(result.errors);
    setIsValid(result.isValid);
    return result.isValid;
  }, [schema, values, validationRules, validationEngine]);
  
  // Reset the form to initial values or new values
  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouchedFields({});
    setIsValid(true);
    setIsDirty(false);
  }, [initialValues]);

  // Update a single field value
  const setValue = useCallback((fieldId, value) => {
    setValues(prev => {
      const newValues = { ...prev, [fieldId]: value };
      
      // Mark the form as dirty when values change
      if (!isDirty && prev[fieldId] !== value) {
        setIsDirty(true);
      }
      
      return newValues;
    });
    
    // Validate the field if it's been touched
    if (touched[fieldId]) {
      validateField(fieldId, value);
    }
  }, [touched, isDirty, validateField]);
  
  // Mark a field as touched (usually on blur)
  const setTouched = useCallback((fieldId, isTouched = true) => {
    setTouchedFields(prev => ({ ...prev, [fieldId]: isTouched }));
    
    // Validate the field when it's marked as touched
    if (isTouched) {
      validateField(fieldId, values[fieldId]);
    }
  }, [values, validateField]);
  
  // Mark all fields as touched (usually on submit)
  const touchAll = useCallback(() => {
    const allTouched = schema.reduce((acc, field) => {
      acc[field.id] = true;
      return acc;
    }, {});
    
    setTouchedFields(allTouched);
    
    // Validate all fields
    validateForm();
  }, [schema, validateForm]);
  
   
  
  // Handle form submission
  const handleSubmit = useCallback((onSubmit) => {
    return (event) => {
      if (event) {
        event.preventDefault();
      }
      
      // Touch all fields to show validation errors
      touchAll();
      
      // Validate the form
      const valid = validateForm();
      
      // Only call onSubmit if the form is valid
      if (valid && onSubmit) {
        onSubmit(values);
      }
      
      return valid;
    };
  }, [values, validateForm, touchAll]);
  
  // Revalidate when validation rules change
  useEffect(() => {
    if (isDirty) {
      validateForm();
    }
  }, [validationRules, validateForm, isDirty]);
  
  return {
    values,
    errors,
    touched,
    isValid,
    isDirty,
    setValue,
    setTouched,
    touchAll,
    validateField,
    validateForm,
    resetForm,
    handleSubmit
  };
};