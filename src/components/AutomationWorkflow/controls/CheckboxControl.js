import React from 'react';
import { createFormControl } from './createFormControl';
import CheckboxElement from './elements/CheckboxElement';

/**
 * Checkbox Control
 *
 * A control for boolean/checkbox properties, implemented using our composition pattern.
 */
export const CheckboxControl = createFormControl({
  type: 'checkbox',
  renderInput: (props) => <CheckboxElement {...props} />,
  validate: (value, rules) => {
    // For checkboxes, we typically only validate if it's required to be checked
    if (rules.required && !value) {
      return rules.requiredMessage || 'This field must be checked';
    }
    
    // Custom validation for specific checkbox scenarios
    if (rules.mustMatchValue !== undefined && value !== rules.mustMatchValue) {
      return rules.mustMatchMessage || 'This field has an invalid value';
    }
    
    return null;
  },
  // Default props specific to checkbox controls
  defaultProps: {
    value: false
  }
});