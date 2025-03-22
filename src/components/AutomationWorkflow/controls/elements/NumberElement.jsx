import React, { useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Number Element
 * 
 * A reusable number input element that handles numeric input rendering and validation
 */
const NumberElement = ({ 
  id: propId, 
  value, 
  onChange, 
  error, 
  min, 
  max, 
  step, 
  placeholder = '', 
  ...props 
}) => {
  // Use a ref to ensure the ID remains stable across renders
  const idRef = useRef(propId || `number-input-${Math.random().toString(36).substr(2, 9)}`);
  const id = idRef.current;
  
  // Simple inline handler
  const handleChange = (e) => {
    const newValue = e.target.value === '' ? undefined : Number(e.target.value);
    onChange(newValue);
  };
  
  return (
    <input
      id={id}
      type="number"
      value={value !== undefined ? value : ''}
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}
      onChange={handleChange}
      {...props}
    />
  );
};

NumberElement.propTypes = {
  id: PropTypes.string,
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  min: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.number,
  placeholder: PropTypes.string
};

// Add display name for debugging
NumberElement.displayName = 'NumberElement';

export default NumberElement;