/**
 * Validation Engine
 * 
 * Handles validation of property values against rules.
 */
export class ValidationEngine {
  constructor(registry) {
    this.registry = registry;
  }
  
  /**
   * Validate a single property value against rules
   */
  validateProperty(propertyId, value, rules, propertySchema) {
    if (!rules) return null;
    
    for (const [ruleType, params] of Object.entries(rules)) {
      // Skip dependency rules - they're handled separately
      if (ruleType === 'dependency') continue;
      
      // Check for custom validator
      const validator = this.registry.getValidator(ruleType);
      if (validator) {
        const error = validator.validate(value, params);
        if (error) return error;
      }
      
      // Check for built-in validator in the control
      if (propertySchema) {
        const control = this.registry.getPropertyControl(propertySchema.type);
        if (control && control.validate) {
          const error = control.validate(value, { [ruleType]: params });
          if (error) return error;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Validate all properties for a node
   */
  validateNodeProperties(nodeType, properties) {
    const plugin = this.registry.getNodeType(nodeType);
    if (!plugin) return {};
    
    const schema = plugin.getPropertySchema();
    const validationRules = plugin.getValidationRules();
    const errors = {};
    
    schema.forEach(propSchema => {
      const propertyId = propSchema.id;
      const value = properties[propertyId];
      const rules = validationRules[propertyId];
      
      if (rules) {
        // Check if this property should be validated based on dependencies
        const shouldValidate = this.shouldValidateProperty(propSchema, properties);
        
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
   */
  shouldValidateProperty(propSchema, properties) {
    if (!propSchema.dependencies || propSchema.dependencies.length === 0) {
      return true;
    }
    
    return propSchema.dependencies.every(dep => {
      const sourceValue = properties[dep.sourceId];
      
      switch (dep.condition) {
        case 'equals':
          return sourceValue === dep.value;
        case 'notEquals':
          return sourceValue !== dep.value;
        case 'contains':
          return Array.isArray(sourceValue) && sourceValue.includes(dep.value);
        case 'notEmpty':
          return sourceValue !== undefined && sourceValue !== null && sourceValue !== '';
        default:
          return true;
      }
    });
  }
}