import React from 'react';
import PropTypes from 'prop-types';

/**
 * Checkbox Element
 * 
 * A reusable checkbox input element for boolean values
 */
const CheckboxElement = ({ id, value, onChange, error, label, disabled, ...props }) => (
  <div className="flex items-center">
    <input
      id={id}
      type="checkbox"
      checked={!!value}
      className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${error ? 'border-red-500' : ''}`}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      {...props}
    />
    {label && (
      <label htmlFor={id} className={`ml-2 block text-sm text-gray-900 ${disabled ? 'opacity-50' : ''}`}>
        {label}
      </label>
    )}
  </div>
);

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

export default CheckboxElement;