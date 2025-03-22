import React from 'react';
import PropTypes from 'prop-types';

/**
 * Number Element
 * 
 * A reusable number input element that handles numeric input rendering and validation
 */
const NumberElement = ({ 
  id, 
  value, 
  onChange, 
  error, 
  min, 
  max, 
  step, 
  placeholder = '', 
  ...props 
}) => (
  <input
    id={id}
    type="number"
    value={value !== undefined ? value : ''}
    placeholder={placeholder}
    min={min}
    max={max}
    step={step}
    className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}
    onChange={(e) => {
      const newValue = e.target.value === '' ? undefined : Number(e.target.value);
      onChange(newValue);
    }}
    {...props}
  />
);

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

export default NumberElement;