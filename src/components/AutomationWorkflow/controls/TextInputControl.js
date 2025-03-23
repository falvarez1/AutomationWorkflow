import React from 'react';
import { createFormControl } from './createFormControl';
import TextInputElement from './elements/TextInputElement';
import { rules, validate } from '../validation';

/**
 * Text Input Control
 *
 * A control for text input properties, refactored to use the new validation framework.
 */
export const TextInputControl = createFormControl({
  type: 'text',
  renderInput: (props) => <TextInputElement {...props} />,
  
  // Generate validation rules based on control configuration
  getValidationRules: (config) => {
    const ruleBuilder = rules();
    
    if (config.required) {
      ruleBuilder.required(config.requiredMessage);
    }
    
    if (config.minLength) {
      ruleBuilder.minLength(config.minLength, config.minLengthMessage);
    }
    
    if (config.maxLength) {
      ruleBuilder.maxLength(config.maxLength, config.maxLengthMessage);
    }
    
    if (config.pattern) {
      ruleBuilder.pattern(config.pattern, config.patternMessage);
    }
    
    if (config.email) {
      ruleBuilder.email(config.emailMessage);
    }
    
    return ruleBuilder.build();
  },
  
  // Use the centralized validation logic
  validate: (value, rules) => {
    // The required rule
    if (rules.required && (!value || value.trim() === '')) {
      return rules.required.message || 'This field is required';
    }
    
    // The minLength rule
    if (rules.minLength && value && value.length < rules.minLength.length) {
      return rules.minLength.message || `Must be at least ${rules.minLength.length} characters`;
    }
    
    // The maxLength rule
    if (rules.maxLength && value && value.length > rules.maxLength.length) {
      return rules.maxLength.message || `Must be no more than ${rules.maxLength.length} characters`;
    }
    
    // The pattern rule
    if (rules.pattern && value && !new RegExp(rules.pattern.pattern).test(value)) {
      return rules.pattern.message || 'Invalid format';
    }
    
    // The email rule
    if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return rules.email.message || 'Invalid email format';
    }
    
    return null;
  }
});