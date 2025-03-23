/**
 * Validation Rule Builder
 * 
 * Utility for building validation rules with a fluent API
 */
export class ValidationRuleBuilder {
  constructor(initialRules = {}) {
    this.rules = { ...initialRules };
  }
  
  /**
   * Add required validation
   * 
   * @param {string} message - Optional custom error message
   * @returns {ValidationRuleBuilder} - Returns this for method chaining
   */
  required(message = 'This field is required') {
    this.rules.required = { message };
    return this;
  }
  
  /**
   * Add min length validation
   * 
   * @param {number} length - Minimum length
   * @param {string} message - Optional custom error message
   * @returns {ValidationRuleBuilder} - Returns this for method chaining
   */
  minLength(length, message = null) {
    this.rules.minLength = { 
      length, 
      message: message || `Must be at least ${length} characters` 
    };
    return this;
  }
  
  /**
   * Add max length validation
   * 
   * @param {number} length - Maximum length
   * @param {string} message - Optional custom error message
   * @returns {ValidationRuleBuilder} - Returns this for method chaining
   */
  maxLength(length, message = null) {
    this.rules.maxLength = { 
      length, 
      message: message || `Must be no more than ${length} characters` 
    };
    return this;
  }
  
  /**
   * Add pattern validation
   * 
   * @param {string|RegExp} pattern - Regex pattern
   * @param {string} message - Optional custom error message
   * @returns {ValidationRuleBuilder} - Returns this for method chaining
   */
  pattern(pattern, message = 'Invalid format') {
    this.rules.pattern = { 
      pattern: pattern instanceof RegExp ? pattern.source : pattern, 
      message 
    };
    return this;
  }
  
  /**
   * Add email validation
   * 
   * @param {string} message - Optional custom error message
   * @returns {ValidationRuleBuilder} - Returns this for method chaining
   */
  email(message = 'Invalid email format') {
    this.rules.email = { message };
    return this;
  }
  
  /**
   * Add min value validation
   * 
   * @param {number} min - Minimum value
   * @param {string} message - Optional custom error message
   * @returns {ValidationRuleBuilder} - Returns this for method chaining
   */
  min(min, message = null) {
    this.rules.min = { 
      min, 
      message: message || `Must be at least ${min}` 
    };
    return this;
  }
  
  /**
   * Add max value validation
   * 
   * @param {number} max - Maximum value
   * @param {string} message - Optional custom error message
   * @returns {ValidationRuleBuilder} - Returns this for method chaining
   */
  max(max, message = null) {
    this.rules.max = { 
      max, 
      message: message || `Must be no more than ${max}` 
    };
    return this;
  }
  
  /**
   * Add options validation
   * 
   * @param {Array} options - Array of valid options
   * @param {string} message - Optional custom error message
   * @returns {ValidationRuleBuilder} - Returns this for method chaining
   */
  options(options, message = 'Invalid option selected') {
    this.rules.options = { options, message };
    return this;
  }
  
  /**
   * Add boolean validation
   * 
   * @param {boolean} mustBeTrue - Whether the value must be true
   * @param {string} message - Optional custom error message
   * @returns {ValidationRuleBuilder} - Returns this for method chaining
   */
  boolean(mustBeTrue = true, message = 'This must be checked') {
    this.rules.boolean = { mustBeTrue, message };
    return this;
  }
  
  /**
   * Add custom validation rule
   * 
   * @param {string} name - Rule name
   * @param {Object} params - Rule parameters
   * @returns {ValidationRuleBuilder} - Returns this for method chaining
   */
  custom(name, params) {
    this.rules[name] = params;
    return this;
  }
  
  /**
   * Add dependency validation rule
   * 
   * @param {string} sourceId - The ID of the field this depends on
   * @param {string} condition - The condition ('equals', 'notEquals', etc.)
   * @param {any} value - The value to compare against
   * @returns {ValidationRuleBuilder} - Returns this for method chaining
   */
  dependency(sourceId, condition, value) {
    if (!this.rules.dependencies) {
      this.rules.dependencies = [];
    }
    this.rules.dependencies.push({ sourceId, condition, value });
    return this;
  }
  
  /**
   * Add condition that makes field required only when another field has a specific value
   * 
   * @param {string} sourceId - The ID of the field this depends on
   * @param {any} value - The value that makes this field required
   * @param {string} message - Optional custom error message
   * @returns {ValidationRuleBuilder} - Returns this for method chaining
   */
  requiredIf(sourceId, value, message = 'This field is required') {
    // Add the dependency
    this.dependency(sourceId, 'equals', value);
    
    // Add a custom conditional required rule
    if (!this.rules.conditionalRequired) {
      this.rules.conditionalRequired = [];
    }
    
    this.rules.conditionalRequired.push({
      sourceId,
      condition: 'equals',
      value,
      message
    });
    
    return this;
  }
  
  /**
   * Build and return the validation rules
   * 
   * @returns {Object} - The built validation rules
   */
  build() {
    return { ...this.rules };
  }
}

/**
 * Shorthand function to create a rule builder
 * 
 * @param {Object} initialRules - Initial rules to start with
 * @returns {ValidationRuleBuilder} - A new rule builder instance
 */
export const rules = (initialRules = {}) => new ValidationRuleBuilder(initialRules);