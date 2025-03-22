import React from 'react';
import PropTypes from 'prop-types';

/**
 * Text Input Element
 * 
 * A reusable text input element that handles basic text input rendering and behavior
 */
const TextInputElement = ({ id, value, onChange, error, placeholder, ...props }) => (
  <input
    id={id}
    type="text"
    value={value || ''}
    placeholder={placeholder}
    className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}
    onChange={(e) => onChange(e.target.value)}
    {...props}
  />
);

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

export default TextInputElement;