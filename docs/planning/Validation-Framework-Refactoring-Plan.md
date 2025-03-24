# Validation Framework Refactoring - Implementation Plan

## Overview

This document outlines the detailed implementation plan for Phase 4 of the Automation Workflow refactoring: enhancing the validation framework. While we already have a basic `ValidationEngine` in place, this phase will expand it into a more robust, centralized validation system that reduces duplication and improves maintainability.

## Current State

The existing validation implementation:
- Has a basic `ValidationEngine` class for validating properties
- Validation logic is spread across multiple locations (controls, plugins, etc.)
- Rule application is inconsistent
- Error messages are not centralized

## Goals

1. Create a centralized validation framework
2. Standardize validation rules
3. Allow for custom rule registration
4. Improve error message consistency
5. Reduce validation code duplication

## Implementation Steps

### Step 1: Enhance the Validation Rule Registry

Create a dedicated rule registry for standard and custom validation rules:

```javascript
// src/components/AutomationWorkflow/validation/ValidationRuleRegistry.js
export class ValidationRuleRegistry {
  constructor() {
    this.rules = {};
  }

  /**
   * Register a validation rule
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
   */
  getRule(ruleType) {
    return this.rules[ruleType] || null;
  }

  /**
   * Check if a rule exists
   */
  hasRule(ruleType) {
    return !!this.rules[ruleType];
  }
}

// Create and export a singleton instance
export const validationRuleRegistry = new ValidationRuleRegistry();
```

### Step 2: Implement Standard Validation Rules

Create standard validation rules that can be used across the application:

```javascript
// src/components/AutomationWorkflow/validation/rules/standardRules.js
import { validationRuleRegistry } from '../ValidationRuleRegistry';

/**
 * Required field validation
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
 */
export const emailRule = {
  validate: (value, params) => {
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return params.message || 'Invalid email format';
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

// Export all rules for direct usage
export const standardRules = {
  required: requiredRule,
  minLength: minLengthRule,
  maxLength: maxLengthRule,
  pattern: patternRule,
  min: minValueRule,
  max: maxValueRule,
  email: emailRule
};
```

### Step 3: Enhance the ValidationEngine

Refactor the existing ValidationEngine to use the rule registry:

```javascript
// src/components/AutomationWorkflow/validation/ValidationEngine.js
import { validationRuleRegistry } from './ValidationRuleRegistry';

/**
 * Enhanced Validation Engine
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
      
      // Try to get the rule from the registry
      const rule = validationRuleRegistry.getRule(ruleType);
      if (rule) {
        const error = rule.validate(value, params);
        if (error) return error;
      } 
      // Fallback to control-specific validation if no rule in registry
      else if (propertySchema) {
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
  
  /**
   * Validate a form with multiple properties
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
}
```

### Step 4: Create Validation Rule Builder

Create a utility for building complex validation rules:

```javascript
// src/components/AutomationWorkflow/validation/ValidationRuleBuilder.js
/**
 * Validation Rule Builder
 * 
 * Utility for building validation rules
 */
export class ValidationRuleBuilder {
  constructor(initialRules = {}) {
    this.rules = { ...initialRules };
  }
  
  /**
   * Add required validation
   */
  required(message = 'This field is required') {
    this.rules.required = { message };
    return this;
  }
  
  /**
   * Add min length validation
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
   */
  pattern(pattern, message = 'Invalid format') {
    this.rules.pattern = { pattern, message };
    return this;
  }
  
  /**
   * Add email validation
   */
  email(message = 'Invalid email format') {
    this.rules.email = { message };
    return this;
  }
  
  /**
   * Add min value validation
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
   */
  max(max, message = null) {
    this.rules.max = { 
      max, 
      message: message || `Must be no more than ${max}` 
    };
    return this;
  }
  
  /**
   * Add custom validation rule
   */
  custom(name, params) {
    this.rules[name] = params;
    return this;
  }
  
  /**
   * Add dependency validation rule
   */
  dependency(sourceId, condition, value) {
    if (!this.rules.dependencies) {
      this.rules.dependencies = [];
    }
    this.rules.dependencies.push({ sourceId, condition, value });
    return this;
  }
  
  /**
   * Get the built rules
   */
  build() {
    return { ...this.rules };
  }
}

/**
 * Shorthand function to create a rule builder
 */
export const rules = (initialRules = {}) => new ValidationRuleBuilder(initialRules);
```

### Step 5: Create Custom Validator Class

Create a base class for custom validators:

```javascript
// src/components/AutomationWorkflow/validation/Validator.js
/**
 * Custom Validator
 * 
 * Base class for creating custom validators
 */
export class Validator {
  constructor(config) {
    this.type = config.type;
    this.validate = config.validate;
    this.defaultMessage = config.defaultMessage || 'Invalid value';
  }
}
```

### Step 6: Implement Form-Level Validation

Create a hook for form-level validation:

```javascript
// src/components/AutomationWorkflow/validation/hooks/useFormValidation.js
import { useState, useCallback } from 'react';
import { ValidationEngine } from '../ValidationEngine';

/**
 * Form Validation Hook
 * 
 * Custom hook for validating forms
 */
export const useFormValidation = (schema, initialValues = {}, validationRules = {}, registry) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(true);
  
  const validationEngine = new ValidationEngine(registry);
  
  // Update a single field value
  const setValue = useCallback((fieldId, value) => {
    setValues(prev => {
      const newValues = { ...prev, [fieldId]: value };
      
      // Validate the field if it's been touched
      if (touched[fieldId]) {
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
            setIsValid(Object.keys(newErrors).length === 0);
            return newErrors;
          });
        }
      }
      
      return newValues;
    });
  }, [schema, validationRules, touched, validationEngine]);
  
  // Mark a field as touched (usually on blur)
  const setTouched = useCallback((fieldId, isTouched = true) => {
    setTouched(prev => ({ ...prev, [fieldId]: isTouched }));
    
    // Validate the field when it's marked as touched
    if (isTouched) {
      const fieldSchema = schema.find(field => field.id === fieldId);
      const fieldRules = validationRules[fieldId];
      if (fieldSchema && fieldRules) {
        const fieldError = validationEngine.validateProperty(
          fieldId, values[fieldId], fieldRules, fieldSchema
        );
        
        setErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          if (fieldError) {
            newErrors[fieldId] = fieldError;
          } else {
            delete newErrors[fieldId];
          }
          setIsValid(Object.keys(newErrors).length === 0);
          return newErrors;
        });
      }
    }
  }, [schema, validationRules, values, validationEngine]);
  
  // Validate the entire form
  const validateForm = useCallback(() => {
    const result = validationEngine.validateForm(schema, values, validationRules);
    setErrors(result.errors);
    setIsValid(result.isValid);
    return result.isValid;
  }, [schema, values, validationRules, validationEngine]);
  
  // Reset the form
  const resetForm = useCallback((newValues = {}) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsValid(true);
  }, []);
  
  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    setTouched,
    validateForm,
    resetForm
  };
};
```

### Step 7: Create Field-Level Validation Hook

```javascript
// src/components/AutomationWorkflow/validation/hooks/useFieldValidation.js
import { useState, useCallback } from 'react';

/**
 * Field Validation Hook
 * 
 * Custom hook for single field validation
 */
export const useFieldValidation = (initialValue, validationRules, validationRegistry) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const [isTouched, setIsTouched] = useState(false);
  
  // Validate the field value
  const validate = useCallback(() => {
    let fieldError = null;
    
    for (const [ruleType, params] of Object.entries(validationRules)) {
      const rule = validationRegistry.getRule(ruleType);
      if (rule) {
        fieldError = rule.validate(value, params);
        if (fieldError) break;
      }
    }
    
    setError(fieldError);
    return !fieldError;
  }, [value, validationRules, validationRegistry]);
  
  // Update the field value
  const handleChange = useCallback((newValue) => {
    setValue(newValue);
    if (isTouched) {
      validate();
    }
  }, [isTouched, validate]);
  
  // Mark the field as touched (usually on blur)
  const handleBlur = useCallback(() => {
    if (!isTouched) {
      setIsTouched(true);
      validate();
    }
  }, [isTouched, validate]);
  
  // Reset the field
  const reset = useCallback((newValue = initialValue) => {
    setValue(newValue);
    setError(null);
    setIsTouched(false);
  }, [initialValue]);
  
  return {
    value,
    error,
    isTouched,
    isValid: !error,
    handleChange,
    handleBlur,
    validate,
    reset
  };
};
```

### Step 8: Update Plugin System to Use Rule Builder

Update the node type plugin factory to use the rule builder:

```javascript
// src/components/AutomationWorkflow/plugins/createNodePlugin.js (partial update)
import { rules } from '../validation/ValidationRuleBuilder';

export function createNodePlugin(config) {
  // ... existing code ...
  
  // Process validation rules, now using the rule builder
  const validationRules = {};
  
  // Process common validation rules
  if (config.useCommonProperties) {
    config.useCommonProperties.forEach(propId => {
      if (commonValidationRules[propId]) {
        validationRules[propId] = commonValidationRules[propId];
      }
    });
  }
  
  // Process custom validation rules
  if (config.validationRules) {
    Object.entries(config.validationRules).forEach(([propId, ruleConfig]) => {
      // If it's already a built rule object, use it directly
      if (typeof ruleConfig === 'object' && !ruleConfig.build) {
        validationRules[propId] = ruleConfig;
      } 
      // If it's a rule builder, build the rules
      else if (ruleConfig.build) {
        validationRules[propId] = ruleConfig.build();
      }
    });
  }
  
  // ... rest of existing code ...
  
  return new NodeTypePlugin({
    // ... existing properties ...
    validationRules
  });
}
```

### Step 9: Create an Index File for Validation Tools

Create an index file to expose the validation tools:

```javascript
// src/components/AutomationWorkflow/validation/index.js
export { ValidationEngine } from './ValidationEngine';
export { validationRuleRegistry } from './ValidationRuleRegistry';
export { standardRules } from './rules/standardRules';
export { rules, ValidationRuleBuilder } from './ValidationRuleBuilder';
export { Validator } from './Validator';
export { useFormValidation } from './hooks/useFormValidation';
export { useFieldValidation } from './hooks/useFieldValidation';
```

### Step 10: Refactor Existing Controls to Use New Validation

Refactor a control like TextInputControl to use the new validation system:

```javascript
// src/components/AutomationWorkflow/controls/TextInputControl.js (example refactoring)
import { PropertyControl } from './PropertyControl';
import { rules } from '../validation/ValidationRuleBuilder';

/**
 * Text Input Control
 *
 * A control for text input properties.
 */
export const TextInputControl = new PropertyControl({
  type: 'text',
  component: ({ value, onChange, label, error, description, ...props }) => {
    // Component implementation
  },
  // Use standardized validation logic
  getValidationRules: (config) => {
    const ruleBuilder = rules();
    
    if (config.required) {
      ruleBuilder.required();
    }
    
    if (config.minLength) {
      ruleBuilder.minLength(config.minLength);
    }
    
    if (config.maxLength) {
      ruleBuilder.maxLength(config.maxLength);
    }
    
    if (config.pattern) {
      ruleBuilder.pattern(config.pattern, config.patternMessage);
    }
    
    return ruleBuilder.build();
  }
});
```

## Benefits

1. **Centralized Validation Rules**: All validation rules are defined in a single place
2. **Standard Rule Application**: Consistent application of rules across the application
3. **Improved Error Messages**: Standardized, customizable error messages
4. **Easier Rule Creation**: Rule builder pattern makes creating rules simpler and more expressive
5. **Better Separation of Concerns**: Validation logic is separated from UI components

## Integration with Existing Code

The enhanced validation framework integrates with:

1. **UI Controls**: Through standardized validation rule application
2. **Node Plugins**: Through the plugin factory's validation rule handling
3. **Property Renderer**: Via the existing ValidationEngine interface

## Testing Strategy

1. **Unit Tests**: Test each validation rule and utility
2. **Integration Tests**: Test validation in the context of controls and plugins
3. **UI Tests**: Test validation in the user interface

## Next Steps After Implementation

1. **Documentation**: Document the validation framework for developers
2. **Examples**: Create example implementations for different use cases
3. **Advanced Rules**: Add more complex validation rules as needed