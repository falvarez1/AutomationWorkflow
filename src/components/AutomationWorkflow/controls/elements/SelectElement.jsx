import React from 'react';
import PropTypes from 'prop-types';

/**
 * Select Element
 * 
 * A reusable select/dropdown element that renders option lists
 */
const SelectElement = ({ id, value, onChange, error, options = [], placeholder = 'Select an option', ...props }) => (
  <select
    id={id}
    value={value || ''}
    className={`w-full p-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md`}
    onChange={(e) => onChange(e.target.value)}
    {...props}
  >
    <option value="">{placeholder}</option>
    {options.map(option => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
);

SelectElement.propTypes = {
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  placeholder: PropTypes.string
};

export default SelectElement;