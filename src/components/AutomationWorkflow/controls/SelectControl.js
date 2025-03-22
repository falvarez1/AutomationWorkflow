import React from 'react';
import { createFormControl } from './createFormControl';
import SelectElement from './elements/SelectElement';

/**
 * Select Control
 *
 * A control for select/dropdown properties, refactored to use the composition pattern.
 */
export const SelectControl = createFormControl({
  type: 'select',
  renderInput: (props) => <SelectElement {...props} />,
  validate: (value, rules) => {
    if (rules.required && (!value || value === '')) {
      return 'This field is required';
    }
    if (rules.allowedValues && value && !rules.allowedValues.includes(value)) {
      return `Value must be one of the allowed options`;
    }
    return null;
  },
  // Default props specific to select controls
  defaultProps: {
    placeholder: 'Select an option'
  }
});