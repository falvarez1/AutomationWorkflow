/**
 * Custom Validator
 * 
 * Base class for creating custom validators
 */
export class Validator {
  /**
   * Create a new validator
   * 
   * @param {Object} config - Validator configuration
   * @param {string} config.type - Validator type (unique identifier)
   * @param {Function} config.validate - Validation function that takes value and params
   * @param {string} config.defaultMessage - Default error message
   */
  constructor(config) {
    this.type = config.type;
    this.validate = config.validate;
    this.defaultMessage = config.defaultMessage || 'Invalid value';
  }
}

/**
 * Create a simple validator with a validation function
 * 
 * @param {string} type - Validator type
 * @param {Function} validateFn - Validation function (value, params) => errorMsg|null
 * @param {string} defaultMessage - Default error message
 * @returns {Validator} - A new validator instance
 */
export const createValidator = (type, validateFn, defaultMessage = 'Invalid value') => {
  return new Validator({
    type,
    validate: validateFn,
    defaultMessage
  });
};