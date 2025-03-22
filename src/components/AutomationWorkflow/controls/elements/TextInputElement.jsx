import React, { useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Text Input Element
 * 
 * A reusable text input element that handles basic text input rendering and behavior
 */
const TextInputElement = ({ id: propId, value, onChange, error, placeholder, ...props }) => {
  // Use a ref to ensure the ID remains stable across renders
  const idRef = useRef(propId || `text-input-${Math.random().toString(36).substr(2, 9)}`);
  const id = idRef.current;
  
  // Simple inline handler
  const handleChange = (e) => {
    onChange(e.target.value);
  };
  
  return (
    <input
      id={id}
      type="text"
      value={value || ''}
      placeholder={placeholder}
      className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}
      onChange={handleChange}
      {...props}
    />
  );
};

TextInputElement.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  placeholder: PropTypes.string
};

TextInputElement.defaultProps = {
  placeholder: ''
};

// Add display name for debugging
TextInputElement.displayName = 'TextInputElement';

export default TextInputElement;