import { validationRuleRegistry } from './ValidationRuleRegistry';

/**
 * Enhanced Validation Engine
 * 
 * Handles validation of property values against rules.
 */
export class ValidationEngine {
  /**
   * Create a new ValidationEngine
   * 
   * @param {Object} registry - Plugin registry containing node types, controls, etc.
   */
  constructor(registry) {
    this.registry = registry;
  }
  
  /**
   * Validate a single property value against rules
   * 
   * @param {string} propertyId - The ID of the property to validate
   * @param {any} value - The value to validate
   * @param {Object} rules - The validation rules to apply
   * @param {Object} propertySchema - The schema for the property
   * @returns {string|null} - Error message or null if valid
   */
  validateProperty(propertyId, value, rules, propertySchema) {
    if (!rules) return null;
    
    for (const [ruleType, params] of Object.entries(rules)) {
      // Skip dependency-related rules - they're handled separately
      if (ruleType === 'dependency' || ruleType === 'dependencies' || 
          ruleType === 'conditionalRequired') continue;
      
      // First try to get the rule from the validation rule registry
      const rule = validationRuleRegistry.getRule(ruleType);
      if (rule) {
        const error = rule.validate(value, params);
        if (error) return error;
      } 
      // If not found, try custom validator in plugin registry
      else {
        const validator = this.registry?.getValidator?.(ruleType);
        if (validator) {
          const error = validator.validate(value, params);
          if (error) return error;
        }
        
        // Fallback to control-specific validation if no rule in registry
        if (propertySchema) {
          const control = this.registry?.getPropertyControl?.(propertySchema.type);
          if (control && control.validate) {
            const error = control.validate(value, { [ruleType]: params });
            if (error) return error;
          }
        }
      }
    }
    
    // Check conditional required rules
    if (rules.conditionalRequired && Array.isArray(rules.conditionalRequired)) {
      for (const condition of rules.conditionalRequired) {
        const sourceValue = this._getSourceValue(condition.sourceId);
        const isConditionMet = this._evaluateCondition(
          sourceValue, 
          condition.condition, 
          condition.value
        );
        
        if (isConditionMet && (value === undefined || value === null || value === '')) {
          return condition.message || 'This field is required';
        }
      }
    }
    
    return null;
  }
  
  /**
   * Get a value from a source property
   * 
   * @param {string} sourceId - The ID of the source property
   * @returns {any} - The value of the source property
   * @private
   */
  _getSourceValue(sourceId) {
    // This is a placeholder - in a real implementation, we would need context
    // about the current form or object being validated
    return null;
  }
  
  /**
   * Evaluate a condition
   * 
   * @param {any} sourceValue - The value to check
   * @param {string} condition - The condition to apply ('equals', 'notEquals', etc.)
   * @param {any} conditionValue - The value to compare against
   * @returns {boolean} - Whether the condition is met
   * @private
   */
  _evaluateCondition(sourceValue, condition, conditionValue) {
    switch (condition) {
      case 'equals':
        return sourceValue === conditionValue;
      case 'notEquals':
        return sourceValue !== conditionValue;
      case 'contains':
        return Array.isArray(sourceValue) && sourceValue.includes(conditionValue);
      case 'notContains':
        return !Array.isArray(sourceValue) || !sourceValue.includes(conditionValue);
      case 'greaterThan':
        return sourceValue > conditionValue;
      case 'greaterThanOrEqual':
        return sourceValue >= conditionValue;
      case 'lessThan':
        return sourceValue < conditionValue;
      case 'lessThanOrEqual':
        return sourceValue <= conditionValue;
      case 'empty':
        return sourceValue === undefined || sourceValue === null || sourceValue === '';
      case 'notEmpty':
        return sourceValue !== undefined && sourceValue !== null && sourceValue !== '';
      default:
        return true;
    }
  }
  
  /**
   * Validate all properties for a node
   * 
   * @param {string} nodeType - The type of node to validate
   * @param {Object} properties - The properties to validate
   * @returns {Object} - Object with validation errors by propertyId
   */
  validateNodeProperties(nodeType, node) {
    const plugin = this.registry?.getNodeType?.(nodeType);
    if (!plugin) return {};
    
    const schema = plugin.getPropertySchema();
    const validationRules = plugin.getValidationRules();
    const errors = {};
    
    schema.forEach(propSchema => {
      const propertyId = propSchema.id;
      
      // Get property value, checking in properties object first, then direct property
      const value = node.properties && node.properties[propertyId] !== undefined
        ? node.properties[propertyId]
        : node[propertyId];
        
      const rules = validationRules[propertyId];
      
      if (rules) {
        // Check if this property should be validated based on dependencies
        const shouldValidate = this.shouldValidateProperty(propSchema, node);
        
        if (shouldValidate) {
          const error = this.validateProperty(propertyId, value, rules, propSchema);
          if (error) errors[propertyId] = error;
        }
      }
    });
    
    return errors;
  }
  
  /**
   * Check if a property should be validated based on its dependencies
   * 
   * @param {Object} propSchema - The schema for the property
   * @param {Object} properties - All properties of the node
   * @returns {boolean} - Whether the property should be validated
   */
  shouldValidateProperty(propSchema, node) {
    if (!propSchema.dependencies || propSchema.dependencies.length === 0) {
      return true;
    }
    
    return propSchema.dependencies.every(dep => {
      // Check in properties object first, then fallback to direct property
      const sourceValue = node.properties && node.properties[dep.sourceId] !== undefined
        ? node.properties[dep.sourceId]
        : node[dep.sourceId];
        
      return this._evaluateCondition(sourceValue, dep.condition, dep.value);
    });
  }
  
  /**
   * Validate a form with multiple properties
   * 
   * @param {Array} schema - Array of field schemas
   * @param {Object} values - Object containing form values
   * @param {Object} rules - Object containing validation rules by field ID
   * @returns {Object} - Object with errors and isValid properties
   */
  validateForm(schema, values, rules) {
    const errors = {};
    
    schema.forEach(field => {
      const fieldRules = rules[field.id];
      if (fieldRules) {
        const value = values[field.id];
        const error = this.validateProperty(field.id, value, fieldRules, field);
        if (error) errors[field.id] = error;
      }
    });
    
    return {
      errors,
      isValid: Object.keys(errors).length === 0
    };
  }
  
  /**
   * Static method to validate a single value with rules
   * 
   * @param {any} value - The value to validate
   * @param {Object} rules - The validation rules to apply
   * @returns {string|null} - Error message or null if valid
   */
  static validate(value, rules) {
    // Create a temporary engine without a registry for simple validations
    const engine = new ValidationEngine();
    return engine.validateProperty('value', value, rules);
  }
}