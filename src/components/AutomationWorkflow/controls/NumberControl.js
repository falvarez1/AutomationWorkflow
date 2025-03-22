import React from 'react';
import { createFormControl } from './createFormControl';
import NumberElement from './elements/NumberElement';

/**
 * Number Control
 *
 * A control for numeric input properties, refactored to use the composition pattern.
 */
export const NumberControl = createFormControl({
  type: 'number',
  renderInput: (props) => <NumberElement {...props} />,
  validate: (value, rules) => {
    if (rules.required && (value === undefined || value === null || value === '')) {
      return 'This field is required';
    }
    if (rules.min !== undefined && value !== undefined && value < rules.min) {
      return `Must be at least ${rules.min}`;
    }
    if (rules.max !== undefined && value !== undefined && value > rules.max) {
      return `Must be no more than ${rules.max}`;
    }
    if (rules.step && value !== undefined && value % rules.step !== 0) {
      return `Must be in increments of ${rules.step}`;
    }
    return null;
  },
  // Default props specific to number controls
  defaultProps: {
    step: 1
  }
});