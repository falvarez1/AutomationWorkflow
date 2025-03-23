/**
 * Validation Framework
 * 
 * Central exports for the validation framework components.
 */

// Import ValidationEngine to use internally
import { ValidationEngine } from './ValidationEngine';

// Core validation components
export { ValidationEngine } from './ValidationEngine';
export { ValidationRuleRegistry, validationRuleRegistry } from './ValidationRuleRegistry';
export { Validator, createValidator } from './Validator';
export { ValidationRuleBuilder, rules } from './ValidationRuleBuilder';

// Validation rules
export { standardRules } from './rules/standardRules';

// Validation hooks
export { useFormValidation } from './hooks/useFormValidation';
export { useFieldValidation } from './hooks/useFieldValidation';


/**
 * Validates a value against the provided rules
 * 
 * @param {any} value - The value to validate
 * @param {Object} rules - The validation rules to apply
 * @returns {string|null} - Error message or null if valid
 */
export const validate = (value, rules) => {
  return ValidationEngine.validate(value, rules);
};