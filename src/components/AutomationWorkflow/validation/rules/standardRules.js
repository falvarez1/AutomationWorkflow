import { validationRuleRegistry } from '../ValidationRuleRegistry';

/**
 * Required field validation
 * 
 * Validates that a field has a value
 */
export const requiredRule = {
  validate: (value, params) => {
    if (value === undefined || value === null || value === '') {
      return params.message || 'This field is required';
    }
    return null;
  }
};

/**
 * Min length validation
 * 
 * Validates that a string value has a minimum length
 */
export const minLengthRule = {
  validate: (value, params) => {
    if (value && value.length < params.length) {
      return params.message || `Must be at least ${params.length} characters`;
    }
    return null;
  }
};

/**
 * Max length validation
 * 
 * Validates that a string value has a maximum length
 */
export const maxLengthRule = {
  validate: (value, params) => {
    if (value && value.length > params.length) {
      return params.message || `Must be no more than ${params.length} characters`;
    }
    return null;
  }
};

/**
 * Pattern validation
 * 
 * Validates that a string value matches a regular expression
 */
export const patternRule = {
  validate: (value, params) => {
    if (value && !new RegExp(params.pattern).test(value)) {
      return params.message || 'Invalid format';
    }
    return null;
  }
};

/**
 * Min value validation
 * 
 * Validates that a numeric value is at least a minimum value
 */
export const minValueRule = {
  validate: (value, params) => {
    if (value !== undefined && value !== null && value < params.min) {
      return params.message || `Must be at least ${params.min}`;
    }
    return null;
  }
};

/**
 * Max value validation
 * 
 * Validates that a numeric value is at most a maximum value
 */
export const maxValueRule = {
  validate: (value, params) => {
    if (value !== undefined && value !== null && value > params.max) {
      return params.message || `Must be no more than ${params.max}`;
    }
    return null;
  }
};

/**
 * Email validation
 * 
 * Validates that a string value is a valid email format
 */
export const emailRule = {
  validate: (value, params) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return params.message || 'Invalid email format';
    }
    return null;
  }
};

/**
 * Options validation
 * 
 * Validates that a value is one of a set of allowed values
 */
export const optionsRule = {
  validate: (value, params) => {
    if (value && params.options && !params.options.includes(value)) {
      return params.message || 'Invalid option selected';
    }
    return null;
  }
};

/**
 * Boolean validation
 * 
 * Validates that a value is true (useful for checkboxes that must be checked)
 */
export const booleanRule = {
  validate: (value, params) => {
    if (params.mustBeTrue && value !== true) {
      return params.message || 'This must be checked';
    }
    return null;
  }
};

// Register all standard rules
validationRuleRegistry.registerRule('required', requiredRule);
validationRuleRegistry.registerRule('minLength', minLengthRule);
validationRuleRegistry.registerRule('maxLength', maxLengthRule);
validationRuleRegistry.registerRule('pattern', patternRule);
validationRuleRegistry.registerRule('min', minValueRule);
validationRuleRegistry.registerRule('max', maxValueRule);
validationRuleRegistry.registerRule('email', emailRule);
validationRuleRegistry.registerRule('options', optionsRule);
validationRuleRegistry.registerRule('boolean', booleanRule);

// Export all rules for direct usage
export const standardRules = {
  required: requiredRule,
  minLength: minLengthRule,
  maxLength: maxLengthRule,
  pattern: patternRule,
  min: minValueRule,
  max: maxValueRule,
  email: emailRule,
  options: optionsRule,
  boolean: booleanRule
};