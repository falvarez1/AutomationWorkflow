import React from 'react';
import { PropertyControl } from './PropertyControl';
import BaseFormControl from './BaseFormControl';

/**
 * Factory function to create a form control
 * This function abstracts the creation of PropertyControl instances
 * with consistent UI structure and behavior
 * 
 * @param {Object} config - Configuration object
 * @returns {PropertyControl} A PropertyControl instance
 */
export const createFormControl = (config) => {
  const {
    type,
    renderInput,
    validate,
    defaultProps = {}
  } = config;
  
  // Create the component using BaseFormControl
  const component = (props) => {
    const {
      value,
      onChange,
      label,
      error,
      description,
      controlProps = {},
      ...rest
    } = props;
    
    // Merge default props with passed props
    const mergedProps = {
      ...defaultProps,
      ...rest,
      ...controlProps
    };
    
    // Create a unique ID for the input if not provided
    const id = rest.id || `${type}-control-${Math.random().toString(36).substr(2, 9)}`;
    
    return (
      <BaseFormControl
        id={id}
        label={label}
        description={description}
        error={error}
        renderInput={(inputProps) => renderInput({
          id,
          value,
          onChange,
          error,
          ...mergedProps,
          ...inputProps
        })}
      />
    );
  };
  
  // Return a PropertyControl instance
  return new PropertyControl({
    type,
    component,
    validate,
    defaultProps
  });
};