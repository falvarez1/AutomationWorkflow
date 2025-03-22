import React, { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Checkbox Element
 *
 * A reusable checkbox input element for boolean values
 * Enhanced with stable ID generation
 */
const CheckboxElement = ({ id: propId, value, onChange, error, label, disabled, ...props }) => {
  // Use a ref to ensure the ID remains stable across renders
  const idRef = useRef(propId || `checkbox-${Math.random().toString(36).substr(2, 9)}`);
  const id = idRef.current;
  
  // Internal check state managed with useState and synced with value prop
  const [checked, setChecked] = useState(!!value);
  useEffect(() => {
    setChecked(!!value);
  }, [value]);
  
  // Update onChange to change internal state before propagating
  const handleChange = (e) => {
    setChecked(e.target.checked);
    onChange(e.target.checked);
  };
  
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked} // Now using internal state instead of direct Boolean coercion
        className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${error ? 'border-red-500' : ''}`}
        onChange={handleChange}
        disabled={disabled}
        {...props}
      />
      {label && (
        <label
          htmlFor={id}
          className={`ml-2 block text-sm text-gray-900 ${disabled ? 'opacity-50' : ''}`}
        >
          {label}
        </label>
      )}
    </div>
  );
};

CheckboxElement.propTypes = {
  id: PropTypes.string,
  value: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  label: PropTypes.string,
  disabled: PropTypes.bool
};

CheckboxElement.defaultProps = {
  value: false,
  disabled: false
};

// Display name for debugging
CheckboxElement.displayName = 'CheckboxElement';

export default CheckboxElement;