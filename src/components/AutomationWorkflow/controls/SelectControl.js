import React from 'react';
import { createFormControl } from './createFormControl';
import SelectElement from './elements/SelectElement';
import { rules, validate } from '../validation';

/**
 * Select Control
 *
 * A control for select/dropdown properties, refactored to use the new validation framework.
 */
export const SelectControl = createFormControl({
  type: 'select',
  renderInput: (props) => <SelectElement {...props} />,
  
  // Generate validation rules based on control configuration
  getValidationRules: (config) => {
    const ruleBuilder = rules();
    
    if (config.required) {
      ruleBuilder.required(config.requiredMessage);
    }
    
    // Handle allowed values validation
    if (config.allowedValues) {
      ruleBuilder.options(
        config.allowedValues,
        config.allowedValuesMessage || 'Value must be one of the allowed options'
      );
    }
    
    // If we have options in controlProps, extract values for validation
    if (config.controlProps?.options && Array.isArray(config.controlProps.options)) {
      const optionValues = config.controlProps.options.map(option => 
        typeof option === 'object' ? option.value : option
      );
      
      ruleBuilder.options(
        optionValues,
        config.allowedValuesMessage || 'Value must be one of the allowed options'
      );
    }
    
    return ruleBuilder.build();
  },
  
  // Use the centralized validation logic
  validate: (value, rules) => {
    // The required rule
    if (rules.required && (!value || value === '')) {
      return rules.required.message || 'This field is required';
    }
    
    // Handle both options rule and legacy allowedValues
    if (rules.options && value) {
      const options = rules.options.options;
      if (Array.isArray(options) && !options.includes(value)) {
        return rules.options.message || 'Value must be one of the allowed options';
      }
    }
    
    if (rules.allowedValues && value && !rules.allowedValues.includes(value)) {
      return 'Value must be one of the allowed options';
    }
    
    return null;
  },
  
  // Default props specific to select controls
  defaultProps: {
    placeholder: 'Select an option'
  }
});