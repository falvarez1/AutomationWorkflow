/**
 * Validation Rule Registry
 * 
 * A central repository for standard and custom validation rules.
 */
export class ValidationRuleRegistry {
  constructor() {
    this.rules = {};
  }

  /**
   * Register a validation rule
   * 
   * @param {string} ruleType - Unique identifier for the rule
   * @param {Object} validator - The validator object with validate method
   * @returns {ValidationRuleRegistry} - Returns this for method chaining
   */
  registerRule(ruleType, validator) {
    if (this.rules[ruleType]) {
      console.warn(`Validation rule '${ruleType}' is already registered. Overriding.`);
    }
    this.rules[ruleType] = validator;
    return this;
  }

  /**
   * Get a validation rule by type
   * 
   * @param {string} ruleType - The rule type to get
   * @returns {Object|null} - The validator object or null if not found
   */
  getRule(ruleType) {
    return this.rules[ruleType] || null;
  }

  /**
   * Check if a rule exists
   * 
   * @param {string} ruleType - The rule type to check
   * @returns {boolean} - Whether the rule exists
   */
  hasRule(ruleType) {
    return !!this.rules[ruleType];
  }

  /**
   * Get all registered rule types
   * 
   * @returns {string[]} - Array of rule type names
   */
  getAllRuleTypes() {
    return Object.keys(this.rules);
  }
}

// Create and export a singleton instance
export const validationRuleRegistry = new ValidationRuleRegistry();