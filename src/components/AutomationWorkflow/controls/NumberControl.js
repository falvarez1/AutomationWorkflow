import React from 'react';
import { createFormControl } from './createFormControl';
import NumberElement from './elements/NumberElement';
import { rules, validate } from '../validation';

/**
 * Number Control
 *
 * A control for numeric input properties, refactored to use the new validation framework.
 */
export const NumberControl = createFormControl({
  type: 'number',
  renderInput: (props) => <NumberElement {...props} />,
  
  // Generate validation rules based on control configuration
  getValidationRules: (config) => {
    const ruleBuilder = rules();
    
    if (config.required) {
      ruleBuilder.required(config.requiredMessage);
    }
    
    if (config.min !== undefined) {
      ruleBuilder.min(config.min, config.minMessage);
    }
    
    if (config.max !== undefined) {
      ruleBuilder.max(config.max, config.maxMessage);
    }
    
    // Add a custom rule for step validation if needed
    if (config.step) {
      ruleBuilder.custom('step', { 
        step: config.step,
        message: config.stepMessage || `Must be in increments of ${config.step}`
      });
    }
    
    return ruleBuilder.build();
  },
  
  // Use the centralized validation logic
  validate: (value, rules) => {
    // Skip validation for undefined or null values unless required
    if (value === undefined || value === null || value === '') {
      return rules.required ? (rules.required.message || 'This field is required') : null;
    }
    
    // Convert string to number if needed
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Validate numeric values only if we have a valid number
    if (!isNaN(numValue)) {
      // The min rule
      if (rules.min !== undefined && numValue < rules.min.min) {
        return rules.min.message || `Must be at least ${rules.min.min}`;
      }
      
      // The max rule
      if (rules.max !== undefined && numValue > rules.max.max) {
        return rules.max.message || `Must be no more than ${rules.max.max}`;
      }
      
      // The step rule (custom)
      if (rules.step && numValue % rules.step.step !== 0) {
        return rules.step.message || `Must be in increments of ${rules.step.step}`;
      }
    } else if (value !== '') {
      // If we have a non-empty value that's not a valid number
      return 'Please enter a valid number';
    }
    
    return null;
  },
  
  // Default props specific to number controls
  defaultProps: {
    step: 1
  }
});