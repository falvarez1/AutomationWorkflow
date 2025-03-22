import React from 'react';
import { createFormControl } from './createFormControl';
import TextInputElement from './elements/TextInputElement';

/**
 * Text Input Control
 *
 * A control for text input properties, refactored to use the composition pattern.
 */
export const TextInputControl = createFormControl({
  type: 'text',
  renderInput: (props) => <TextInputElement {...props} />,
  validate: (value, rules) => {
    if (rules.required && (!value || value.trim() === '')) {
      return 'This field is required';
    }
    if (rules.minLength && value && value.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }
    if (rules.maxLength && value && value.length > rules.maxLength) {
      return `Must be no more than ${rules.maxLength} characters`;
    }
    if (rules.pattern && value && !new RegExp(rules.pattern).test(value)) {
      return rules.patternMessage || 'Invalid format';
    }
    return null;
  }
});