import React, { useRef, memo } from 'react';
import { PropertyControl } from './PropertyControl';
import BaseFormControl from './BaseFormControl';
import { validate } from '../validation';

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
    validate: validateFn,
    getValidationRules,
    defaultProps = {}
  } = config;
  
  // Create the component using BaseFormControl
  const ControlComponent = memo((props) => {
    const {
      value,
      onChange,
      label,
      error,
      description,
      controlProps = {},
      ...rest
    } = props;
    
    // Use controlProps.id if available, otherwise check rest.id, then auto-generate
    const generatedId = `${type}-control-${Math.random().toString(36).substr(2, 9)}`;
    const idRef = useRef(controlProps.id || rest.id || generatedId);
    const id = idRef.current;
    
    // Merge default props with passed props - do this inline to avoid dependencies
    const mergedProps = {
      ...defaultProps,
      ...rest,
      ...controlProps
    };
    
    return (
      <BaseFormControl
        id={id}
        label={label}
        description={description}
        error={error}
        renderInput={() => renderInput({
          id,
          value,
          onChange,
          error,
          ...mergedProps
        })}
      />
    );
  }, (prev, next) => {
    // Only re-render if certain props changed
    return (
      prev.value === next.value &&
      prev.error === next.error &&
      prev.label === next.label &&
      prev.description === next.description
    );
  });
  
  // Add display name for debugging
  ControlComponent.displayName = `${type.charAt(0).toUpperCase() + type.slice(1)}Control`;
  
  // Return a PropertyControl instance
  return new PropertyControl({
    type,
    component: ControlComponent,
    validate: validateFn,
    getValidationRules,
    defaultProps
  });
};