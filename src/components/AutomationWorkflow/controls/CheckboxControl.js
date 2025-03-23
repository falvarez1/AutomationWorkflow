import React from 'react';
import { createFormControl } from './createFormControl';
import CheckboxElement from './elements/CheckboxElement';
import { rules, validate } from '../validation';

/**
 * Checkbox Control
 *
 * A control for boolean/checkbox properties, refactored to use the new validation framework.
 */
export const CheckboxControl = createFormControl({
  type: 'checkbox',
  renderInput: (props) => <CheckboxElement {...props} />,
  
  // Generate validation rules based on control configuration
  getValidationRules: (config) => {
    const ruleBuilder = rules();
    
    // For checkboxes, required means "must be checked"
    if (config.required) {
      ruleBuilder.boolean(
        true, 
        config.requiredMessage || 'This field must be checked'
      );
    }
    
    // Handle must-match validation as a custom rule
    if (config.mustMatchValue !== undefined) {
      ruleBuilder.custom('mustMatch', {
        value: config.mustMatchValue,
        message: config.mustMatchMessage || 'This field has an invalid value'
      });
    }
    
    return ruleBuilder.build();
  },
  
  // Use the centralized validation logic
  validate: (value, rules) => {
    // Handle the boolean rule (must be checked)
    if (rules.boolean && rules.boolean.mustBeTrue && value !== true) {
      return rules.boolean.message || 'This field must be checked';
    }
    
    // Handle custom mustMatch rule
    if (rules.mustMatch && value !== rules.mustMatch.value) {
      return rules.mustMatch.message || 'This field has an invalid value';
    }
    
    // Legacy support for the old required validation
    if (rules.required && !value) {
      return rules.requiredMessage || 'This field must be checked';
    }
    
    return null;
  },
  
  // Default props specific to checkbox controls
  defaultProps: {
    value: false
  }
});